import CallTreeNode from "../types/CallTreeNode"

type SidebarProps = {
    tree: CallTreeNode
}

const Sidebar: React.FC<SidebarProps> = ({ tree }) => {
    console.log(tree.name)
    return (
        <div>HELLO WORLD</div>
    )
}

export default Sidebar