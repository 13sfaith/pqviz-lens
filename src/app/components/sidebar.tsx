"use client";

import { useState } from "react";
import CallTreeNode from "../types/CallTreeNode"

type SidebarProps = {
    node: CallTreeNode,
    onSelect: (node: CallTreeNode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ node, onSelect }) => {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = node.calls && node.calls.length > 0;

    return (
        <div style={{ marginLeft: 16 }}>
            <div
                style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
                onClick={() => onSelect(node)}
            >
                {hasChildren && (
                    <div
                        onClick={(e) => {
                            e.stopPropagation(); // prevent onSelect from firing
                            setExpanded(!expanded);
                        }}
                        style={{ marginRight: 4 }}
                    >
                        {expanded ? "▼" : "▶"}
                    </div>
                )}
                <span>{node.name}</span>
            </div>
            {expanded &&
                node.calls?.map((call) => (
                    // TODO create a key
                    <Sidebar node={call} onSelect={onSelect} />
                ))}
        </div>
    );
};

export default Sidebar