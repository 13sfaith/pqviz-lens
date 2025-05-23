"use client";

import { ReactFlow, MiniMap, type Node, type Edge } from "@xyflow/react"
import { buildDependencyGraph } from "./graphBuilder"
import CallTreeNode from "./types/CallTreeNode"
import { useEffect, useState } from "react"
import Sidebar from "./components/sidebar"
import { parse } from 'flatted'

import "@xyflow/react/dist/style.css";


export default function Home() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [root, setRoot] = useState<CallTreeNode | null>(null);

  async function buildGraph(root: CallTreeNode) {
    console.log(root)
    const graph = await buildDependencyGraph(root);
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    graph.nodes().forEach((id) => {
      const nodePosition = graph.node(id);
      newNodes.push({
        id,
        position: { x: nodePosition.x, y: nodePosition.y },
        data: { label: nodePosition.label },
      });
    });

    let edgeNumber = 0;
    graph.edges().forEach((id) => {
      const edgePosition = graph.edge(id);
      newEdges.push({
        id: `e-${edgeNumber++}-${Math.floor(Math.random() * 1000)}`,
        source: id.v,
        target: id.w,
      });
    });

    console.log('newnode length: ', newNodes.length)
    console.log('newedge length: ', newEdges.length)

    setNodes(newNodes);
    setEdges(newEdges);
  }

  async function setTraceRoot(traceRoot: CallTreeNode) {
    setRoot(traceRoot);
    await buildGraph(traceRoot);
  }

  async function nodeSelect(node: CallTreeNode) {
    console.log("node select!");
    await buildGraph(node);
  }

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080')
    socket.onopen = () => {
      console.log('webSocket connected')
    }
    socket.onmessage = (event: any) => {
      let jsonMessage = JSON.parse(event.data)
      if (jsonMessage.type != 'trace') {
        return
      }

      setTraceRoot(parse(jsonMessage.message))
    }
    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, []);

  if (!root) return null; // or a spinner/loading UI

  return (
    <div style={{ width: "100vw", height: "110vh" }}>
      <Sidebar node={root} onSelect={nodeSelect} />
      <ReactFlow key={nodes.length + '-' + edges.length} colorMode="dark" nodes={nodes} edges={edges}>
        <MiniMap nodeColor={"#ffffff"} nodeStrokeWidth={3} pannable />
      </ReactFlow>
    </div>
  );
}
