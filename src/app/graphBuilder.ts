import dagre from '@dagrejs/dagre'
import trace from './trace.json'

// Create a new directed graph 
var g = new dagre.graphlib.Graph();

// Set an object for the graph label
g.setGraph({});

// Default to assigning a new object as a label for each new edge.
g.setDefaultEdgeLabel(function() { return {}; });

// Add nodes to the graph. The first argument is the node id. The second is
// metadata about the node. In this case we're going to add labels to each of
// our nodes.
/*
g.setNode("kspacey",    { label: "Kevin Spacey",  width: 144, height: 100 });
g.setNode("swilliams",  { label: "Saul Williams", width: 160, height: 100 });
g.setNode("bpitt",      { label: "Brad Pitt",     width: 108, height: 100 });
g.setNode("hford",      { label: "Harrison Ford", width: 168, height: 100 });
g.setNode("lwilson",    { label: "Luke Wilson",   width: 144, height: 100 });
g.setNode("kbacon",     { label: "Kevin Bacon",   width: 121, height: 100 });

// Add edges to the graph.
g.setEdge("kspacey",   "swilliams");
g.setEdge("swilliams", "kbacon");
g.setEdge("bpitt",     "kbacon");
g.setEdge("hford",     "lwilson");
g.setEdge("lwilson",   "kbacon");
*/


export async function buildGraph() {
    processTrace()

    let exisitingNodes: { [key: string]: number } = {}

    for (let i = 0; i < trace.length; i++) {
        if (trace[i].type != 'functionCall') {
            continue
        }
        
        if (exisitingNodes[trace[i].from] == undefined) {
            exisitingNodes[trace[i].from] = 0
            g.setNode(trace[i].from, { label: trace[i].from, width: 200, height: 100 })
        }
        if (exisitingNodes[trace[i].to] == undefined) {
            exisitingNodes[trace[i].to] = 0
            g.setNode(trace[i].to, { label: trace[i].to, width: 200, height: 100 })
        }

        g.setEdge(trace[i].from, trace[i].to);
    }

    dagre.layout(g, { rankdir: 'LR' });

    return g
}

function processTrace() {
    renameConstructor()

    renameTLS()
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
            trace[i].from = currentTop
        }
        if (trace[i].to == 'TLS') {
            trace[i].to = currentTop
        }
    }
}