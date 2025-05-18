"use client"

import styles from "./page.module.css";
import Sidebar from "./components/sidebar";
import { ReactFlow, MiniMap, type Node, type Edge } from '@xyflow/react';
import { buildTraceGraph, buildDependencyGraph } from './graphBuilder';
import CallTreeNode from "./types/CallTreeNode";


import '@xyflow/react/dist/style.css';

const initalNodes: Node[] = []
const initalEdges: Edge[] = []
let root: CallTreeNode = CallTreeNode.newRoot("blank")

async function buildGraph(root: CallTreeNode) {
  initalNodes.length = 0
  initalEdges.length = 0

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
    initalEdges.push(edge);
  })
}

async function populateNodes() {
  let traceRoot = await buildTraceGraph()
  root = traceRoot

  buildGraph(traceRoot)
}

async function nodeSelect(node: CallTreeNode) {
  console.log("node select!")
  buildGraph(node)
}

export default function Home() {
  populateNodes()
  return (
    <div style={{ width: '100vw', height: '110vh' }}>
      <Sidebar node={root} onSelect={nodeSelect}></Sidebar>
      <ReactFlow colorMode="dark" nodes={initalNodes} edges={initalEdges}>
        <MiniMap nodeColor={'#ffffff'} nodeStrokeWidth={3} pannable /> 
      </ReactFlow>
    </div>
  );
}
