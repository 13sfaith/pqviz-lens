import importedTrace from './trace.json' 
import TraceType from './types/TraceType'
import CallTreeNode from './types/CallTreeNode'
import dagre, { graphlib } from '@dagrejs/dagre'

const trace = importedTrace as Array<TraceType>

var g: graphlib.Graph;
var exisitingNodes: { [key: string]: boolean } = {}
var exisitingEdges: { [key: string]: boolean } = {}

export async function buildDependencyGraph(root: CallTreeNode) {
    exisitingNodes = {}
    exisitingEdges = {}
    g = new dagre.graphlib.Graph();
    g.setGraph({});
    g.setDefaultEdgeLabel(function() { return {}; });
    buildFunctionCallMap(root)
    dagre.layout(g);
    return g
}

function buildFunctionCallMap(root: CallTreeNode) {
    for (let i = 0; i < root.calls.length; i++) {
        addNode(root.name)
        addNode(root.calls[i].name)
        addEdge(root.name, root.calls[i].name)
    }
    for (let i = 0; i < root.calls.length; i++) {
        buildFunctionCallMap(root.calls[i])
    }
}

function addNode(name: string) {
    if (exisitingNodes[name] != true) {
        exisitingNodes[name] = true
        g.setNode(name, { label: name, width: 150, height: 50 })
    }
}


function addEdge(from: string, to: string) {
    let key = from + to
    if (exisitingEdges[key] != true) {
        exisitingEdges[key] = true;
        g.setEdge(from, to)
    }
}