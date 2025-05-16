import styles from "./page.module.css";
import { ReactFlow, MiniMap, type Node, type Edge } from '@xyflow/react';
import { buildTraceGraph, buildDependencyGraph } from './graphBuilder';


import '@xyflow/react/dist/style.css';

const initalNodes: Node[] = [ ]
const initialEdges: Edge[] = []

async function buildGraph(root) {
  let graph = await buildDependencyGraph(root)

  graph.nodes().forEach((id) => {
    let nodePosition = graph.node(id)
    let node: Node = {
      id: id,
      position: { x: nodePosition.x, y: nodePosition.y },
      data: { label: nodePosition.label }
    };
    initalNodes.push(node)
  })

  let edgeNumber = 0
  graph.edges().forEach((id) => {
    let edgePosition = graph.edge(id)
    // console.log(id)
    let edge: Edge = {
      id: 'e-' + edgeNumber + Math.floor(Math.random() * 1000),
      source: id.v,
      target: id.w,
    }
    edgeNumber++;
    initialEdges.push(edge);
  })
}

async function populateNodes() {
  let traceRoot = await buildTraceGraph()

  buildGraph(traceRoot)
}

export default function Home() {
  populateNodes()
  return (
    <div style={{ width: '100vw', height: '110vh' }}>
      <ReactFlow colorMode="dark" nodes={initalNodes} edges={initialEdges}>
        <MiniMap nodeColor={'#ffffff'} nodeStrokeWidth={3} pannable /> 
      </ReactFlow>
    </div>
  );
}
