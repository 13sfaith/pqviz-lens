import styles from "./page.module.css";
import { ReactFlow, type Node, type Edge } from '@xyflow/react';
import { buildGraph } from './graphBuilder';


import '@xyflow/react/dist/style.css';

const initalNodes: Node[] = [
]
// const initialEdges: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }]
const initialEdges: Edge[] = []

async function populateNodes() {
  let graph = await buildGraph()

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
    console.log(id)
    let edge: Edge = {
      id: 'e-' + edgeNumber,
      source: id.v,
      target: id.w,
    }
    edgeNumber++;
    initialEdges.push(edge);
  })

}

export default function Home() {
  populateNodes()
  return (
    <div style={{ width: '100vw', height: '110vh' }}>
      <ReactFlow colorMode="dark" nodes={initalNodes} edges={initialEdges} />
    </div>
  );
}
