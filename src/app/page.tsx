import styles from "./page.module.css";
import { ReactFlow, type Node, type Edge } from '@xyflow/react';

import '@xyflow/react/dist/style.css';

const initalNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0}, data: { label: '1'} },
  { id: '2', position: { x: 0, y: 100}, data: { label: '2'} },
]
const initialEdges: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }]

export default function Home() {
  return (
    <div style={{ width: '100vw', height: '110vh' }}>
      <ReactFlow colorMode="dark" nodes={initalNodes} edges={initialEdges} />
    </div>
  );
}
