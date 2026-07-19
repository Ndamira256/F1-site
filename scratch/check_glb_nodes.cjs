const fs = require('fs');
const path = require('path');

const glbPath = path.join(__dirname, '..', 'public', 'ferrari_f1_2019.glb');
const buffer = fs.readFileSync(glbPath);

const chunkLength = buffer.readUInt32LE(12);
const jsonStr = buffer.toString('utf8', 20, 20 + chunkLength);
const gltf = JSON.parse(jsonStr);

let output = '';
if (gltf.nodes) {
  gltf.nodes.forEach((node, idx) => {
    output += `Node [${idx}]: "${node.name}" (Mesh: ${node.mesh !== undefined ? node.mesh : 'None'}, Children: ${node.children ? node.children.join(', ') : 'None'})\n`;
  });
}

fs.writeFileSync(path.join(__dirname, 'nodes.txt'), output);
console.log('Nodes written to scratch/nodes.txt');
