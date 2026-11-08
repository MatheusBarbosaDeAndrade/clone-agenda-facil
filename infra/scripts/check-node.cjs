// Verifica a versão do Node antes de rodar os scripts (funciona até em Node antigo).
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 20 || (major === 20 && minor < 9)) {
  console.error(
    `\n✖ Node ${process.versions.node} detectado. Este projeto precisa do Node 24 (mínimo 20.9).\n` +
      "  Rode:  nvm use        (usa a versão do arquivo .nvmrc)\n" +
      "  Para tornar permanente:  nvm alias default 24\n",
  );
  process.exit(1);
}
