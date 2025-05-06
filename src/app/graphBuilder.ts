import dagre from '@dagrejs/dagre'
import trace from './trace.json'
import path from 'path'
import { assert } from 'console';

// Create a new directed graph 
var g = new dagre.graphlib.Graph();

// Set an object for the graph label
g.setGraph({});

// Default to assigning a new object as a label for each new edge.
g.setDefaultEdgeLabel(function() { return {}; });

export async function buildGraph() {
    processTrace()
    // dagre.layout(g, { rankdir: 'LR' });
    dagre.layout(g);

    return g
}

function processTrace() {
    renameConstructor()

    renameTLS()

    let imports = buildImportMap()
    buildCallTree(imports)

    buildFunctionCallMap()
}

function renameConstructor() {
    for (let i = 0; i < trace.length; i++) {
        if (trace[i].from == 'constructor') {
            trace[i].from = '_constructor'
        }
        if (trace[i].to == 'constructor') {
            trace[i].to = '_constructor'
        }
    }
}

function renameTLS() {
    let currentTop = 'TLS'
    for (let i = 0; i < trace.length; i++) {
        if (trace[i].type == 'moduleStart') {
            currentTop = trace[i].file || '' 
        }

        if (trace[i].type != 'functionCall') {
            continue
        }

        if (trace[i].from == 'TLS') {
            trace[i].from = trace[i].callingFile
        }
        if (trace[i].to == 'TLS') {
            trace[i].to = currentTop
        }
    }
}

type importDefinition = {
    sourcePath: string,
    importPath: string
}

function buildImportMap(): Array<importDefinition> {
    let imports: Array<importDefinition> = []

    for (let i = 0; i < trace.length; i++) {
        if (trace[i].type != 'import') {
            continue
        }
        if (trace[i].sourcePath?.includes('node_modules') || trace[i].sourcePath?.includes('node:')) {
            continue
        }
        if (trace[i].importPath?.includes('node_modules') || trace[i].importPath?.includes('node:')) {
            continue
        }
        if (trace[i].importPath?.includes('monitor/monitor.js')) {
            continue
        }

        imports.push({ sourcePath: stripTmpDirectory(trace[i].sourcePath), importPath: stripTmpDirectory(trace[i].importPath) })
    }

    for (let i = 0; i < imports.length; i++) {
        addNode(imports[i].sourcePath)
        addNode(imports[i].importPath)
        g.setEdge(imports[i].sourcePath, imports[i].importPath)
    }

    console.log(imports)
    return imports
}

function buildFunctionCallMap() {
    for (let i = 0; i < trace.length; i++) {
        if (trace[i].type != 'functionCall') {
            continue
        }

        addNode(trace[i].from || '')
        addNode(trace[i].to || '')
        addEdge(trace[i].from || '', trace[i].to || '')
    }
}

type CallTreeNode = {
    name: string,
    calls: Array<CallTreeNode>,
    parent?: CallTreeNode
}
const CallTreeNode = {
    newRoot: (name: string): CallTreeNode => ({ name, calls: [] }),
    new: (name: string, parent: CallTreeNode): CallTreeNode => ({ name, calls: [], parent })
}


type functionCall = {
    type: "functionCall",
    from: string,
    to: string,
    callingFile: string,
    callingLine: Number,
    args: Array<any>
}

type functionStart = {
    type: "functionStart",
    name: string,
    file: string,
    line: number
}

function isFunctionCall(x: any): x is functionCall {
    return x.type == "functionCall"
}

function buildCallTree(imports: Array<importDefinition>) {
    let root: CallTreeNode = {} as CallTreeNode

    root.name = imports[0].sourcePath
    root.calls = []

    let currentNode: CallTreeNode = {} as CallTreeNode
    currentNode = root

    for (let i = 0; i < imports.length; i++) {
        let searchResult: WalkUpResult = walkUpTreeTillNodeFound(currentNode, imports[i].sourcePath)
        if (searchResult.found == false) {
            break
        }
        currentNode = searchResult.node

        let callNode: CallTreeNode = {} as CallTreeNode
        callNode.name = imports[i].importPath
        callNode.calls = []
        callNode.parent = currentNode

        currentNode.calls.push(callNode)
        currentNode = callNode
    }

    let firstCall: functionCall = trace.find((a) => a.type == 'functionCall') as functionCall
    currentNode = findFirstCall(root, firstCall.from) 
    if (currentNode.name == "") {
        console.error("unable to find fird called node")
    }

    populateCallTreeWithFunctionCalls(currentNode)

    // printCallTree(root) 
}

function populateCallTreeWithFunctionCalls(currentNode: CallTreeNode) {

    for (let i = 0; i < trace.length - 1; i++) {
        if (trace[i].type != 'functionCall') {
            continue
        }
        if (trace[i+1].type != 'functionStart') {
            continue
        }
        let functionCall = trace[i] as functionCall
        let functionStart = trace[i+1] as functionStart

        if (functionCall.to == functionStart.name) {
            continue;
        }
        functionCall.to = functionStart.name
        let lineNumber = functionStart.line + 1

        /*
        let currentIndex = i
        for (; currentIndex < trace.length; currentIndex++) {
            if (trace[currentIndex].type != 'functionCall') {
                continue
            }
            let currentNode = trace[currentIndex] as functionCall
            if (currentNode.callingLine != lineNumber) {
                continue
            }
            if (currentNode.from != functionStart.name) {
                continue
            }
            currentNode.from = functionStart.name
        }
            */
    }

    let functionCalls: Array<functionCall> = trace.filter((a) => a.type == 'functionCall') as Array<functionCall>

    for (let i = 0; i < functionCalls.length; i++) {
        if (!isFunctionCall(functionCalls[i])) {
            continue;
        }
        let currentFunction = functionCalls[i] as functionCall

        if (currentFunction.from != currentNode.name) {
            let searchResult: WalkUpResult = walkUpTreeTillNodeFound(currentNode, currentFunction.from)
            if (searchResult.found == false) {
                console.log("search not found: ")
                console.log("current node: ", currentNode.name)
                console.log(functionCalls[i])
                continue
            }
            currentNode = searchResult.node
        }

        let newNode = CallTreeNode.new(currentFunction.to, currentNode)
        currentNode.calls.push(newNode)

        currentNode = newNode
    }
}

function stripTmpDirectory(dir: string | undefined) {
    dir = dir || ''
    let dirPieces = dir.split(path.sep)
    let tmpIndex = dirPieces.findIndex((a) => {
        return a.includes('tmp-')
    })

    return dirPieces.splice(tmpIndex + 1).join(path.sep)
}

const exisitingNodes: { [key: string]: boolean } = {}

function addNode(name: string) {
    if (exisitingNodes[name] != true) {
        exisitingNodes[name] = true
        g.setNode(name, { label: name, width: 150, height: 50 })
    }
}

const exisitingEdges: { [key: string]: boolean } = {}

function addEdge(from: string, to: string) {
    let key = from + to
    if (exisitingEdges[key] != true) {
        exisitingEdges[key] = true;
        g.setEdge(from, to)
    }

}

// Depth first search to find a node
function findFirstCall(root: CallTreeNode, call: string): CallTreeNode {
    let currentNode = root

    if (currentNode.name == call) {
        return currentNode
    }

    for (let i = 0; i < currentNode.calls.length; i++) {
        let foundNode = findFirstCall(currentNode.calls[i], call)
        if (foundNode.name != "") {
            return foundNode
        }
    }

    return { name: "" } as CallTreeNode
}

type WalkUpResult = 
    | { found: true; node: CallTreeNode }
    | { found: false }

const WalkUpResult = {
    found: (node: CallTreeNode): WalkUpResult => ({ found: true, node }),
    notFound: (): WalkUpResult => ({ found: false })
}

/**
 * Expects some node in a tree.
 * Will go up one parent at a time looking for a node of name `name`. 
 * If the name is a file will also check the children at each node.
 * @param referenceNode The node to start searching from
 * @param name The desired node name we are searching for
 * @returns If found, the node named `name`, else undefined node `{ name: "" }`
 */
function walkUpTreeTillNodeFound(referenceNode: CallTreeNode, name: string): WalkUpResult {
    let currentNode = referenceNode
    while (currentNode.name != name) {
        if (currentNode.name.endsWith('.js')) {
            for (let i = 0; i < currentNode.calls.length; i++) {
                if (currentNode.calls[i].name == name)  {
                    return WalkUpResult.found(currentNode.calls[i])
                }
            }
        }

        if (currentNode.parent == undefined) {
            console.log("reached the root...")
            return WalkUpResult.notFound()
        }

        currentNode = currentNode.parent
    }
    return WalkUpResult.found(currentNode)
}

function printCallTree(root: CallTreeNode, level: number = 0) {
    let current = root
    console.log("-".repeat(level), current.name)

    for (let i = 0; i < current.calls.length; i++) {
        printCallTree(current.calls[i], level + 1)
    }
}