const formularioPost = document.querySelector("#formulario-post");
const listaPublicacoes = document.querySelector("#lista-publicacoes");
const mensagem = document.querySelector("#mensagem");
const tamanhoMaximoImagem = 2 * 1024 * 1024;

let publicacoes = [];
let armazenamentoDisponivel = true;

function carregarPublicacoes() {
  try {
    const dadosSalvos = localStorage.getItem("blog-publicacoes");
    publicacoes = dadosSalvos ? JSON.parse(dadosSalvos) : [];

    if (!Array.isArray(publicacoes)) {
      throw new Error("Os dados salvos não têm o formato esperado.");
    }
  } catch (erro) {
    armazenamentoDisponivel = false;
    mensagem.textContent = "Não foi possível carregar as publicações salvas neste navegador.";
    console.error("Erro ao carregar publicações:", erro);
    publicacoes = [];
  }
}

function salvarPublicacoes() {
  if (!armazenamentoDisponivel) {
    mensagem.textContent = "Não foi possível salvar. Verifique os dados do navegador e recarregue a página.";
    return false;
  }

  try {
    localStorage.setItem("blog-publicacoes", JSON.stringify(publicacoes));
    return true;
  } catch (erro) {
    mensagem.textContent = "Não foi possível salvar a publicação neste navegador.";
    console.error("Erro ao salvar publicações:", erro);
    return false;
  }
}

function lerImagem(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();

    leitor.addEventListener("load", () => resolve(leitor.result));
    leitor.addEventListener("error", () => reject(new Error("Não foi possível ler a imagem selecionada.")));
    leitor.readAsDataURL(arquivo);
  });
}

function criarElemento(tag, texto, classe) {
  const elemento = document.createElement(tag);
  elemento.textContent = texto;

  if (classe) {
    elemento.className = classe;
  }

  return elemento;
}

function mostrarPublicacoes() {
  listaPublicacoes.replaceChildren();

  if (publicacoes.length === 0) {
    listaPublicacoes.append(
      criarElemento("p", "Ainda não há publicações. Seja o primeiro a escrever!", "aviso-vazio")
    );
    return;
  }

  publicacoes.forEach((publicacao) => {
    const cartao = document.createElement("article");
    cartao.className = "cartao-publicacao";
    cartao.append(criarElemento("h3", publicacao.titulo));
    cartao.append(criarElemento("p", publicacao.data, "data-publicacao"));

    if (publicacao.imagem) {
      const imagem = document.createElement("img");
      imagem.className = "imagem-publicacao";
      imagem.src = publicacao.imagem;
      imagem.alt = `Imagem da publicação: ${publicacao.titulo}`;
      imagem.addEventListener("error", () => {
        imagem.remove();
      });
      cartao.append(imagem);
    }

    cartao.append(criarElemento("p", publicacao.texto, "texto-publicacao"));
    cartao.append(criarSecaoComentarios(publicacao));
    listaPublicacoes.append(cartao);
  });
}

function criarSecaoComentarios(publicacao) {
  const secao = document.createElement("section");
  secao.className = "secao-comentarios";
  secao.append(criarElemento("h3", "Comentários"));

  const lista = document.createElement("ul");
  lista.className = "lista-comentarios";

  publicacao.comentarios.forEach((comentario) => {
    lista.append(criarElemento("li", comentario));
  });

  if (publicacao.comentarios.length === 0) {
    lista.append(criarElemento("li", "Ainda não há comentários."));
  }

  secao.append(lista);

  const formulario = document.createElement("form");
  formulario.className = "formulario-comentario";

  const campo = document.createElement("input");
  campo.type = "text";
  campo.maxLength = 200;
  campo.placeholder = "Escreva um comentário";
  campo.setAttribute("aria-label", `Comentário para ${publicacao.titulo}`);
  campo.required = true;

  const botao = document.createElement("button");
  botao.type = "submit";
  botao.textContent = "Comentar";

  formulario.append(campo, botao);
  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const textoComentario = campo.value.trim();

    if (textoComentario === "") {
      return;
    }

    publicacao.comentarios.push(textoComentario);

    if (salvarPublicacoes()) {
      mensagem.textContent = "Comentário adicionado.";
      mostrarPublicacoes();
    }
  });

  secao.append(formulario);
  return secao;
}

formularioPost.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagem.textContent = "";

  const dadosFormulario = new FormData(formularioPost);
  const titulo = dadosFormulario.get("titulo").trim();
  const texto = dadosFormulario.get("texto").trim();
  const enderecoImagem = dadosFormulario.get("imagem").trim();
  const arquivoImagem = dadosFormulario.get("arquivoImagem");

  if (enderecoImagem && arquivoImagem.size > 0) {
    mensagem.textContent = "Escolha uma imagem do dispositivo ou informe um endereço, não os dois.";
    return;
  }

  if (enderecoImagem && !["http:", "https:"].includes(new URL(enderecoImagem).protocol)) {
    mensagem.textContent = "O endereço da imagem deve começar com http:// ou https://.";
    return;
  }

  if (arquivoImagem.size > tamanhoMaximoImagem) {
    mensagem.textContent = "A imagem deve ter no máximo 2 MB.";
    return;
  }

  if (arquivoImagem.size > 0 && !arquivoImagem.type.startsWith("image/")) {
    mensagem.textContent = "Selecione um arquivo de imagem.";
    return;
  }

  let imagem = enderecoImagem;

  if (arquivoImagem.size > 0) {
    try {
      imagem = await lerImagem(arquivoImagem);
    } catch (erro) {
      mensagem.textContent = erro.message;
      console.error("Erro ao ler imagem:", erro);
      return;
    }
  }

  const publicacao = {
    titulo,
    texto,
    imagem,
    data: new Date().toLocaleString("pt-BR"),
    comentarios: []
  };

  publicacoes.unshift(publicacao);

  if (salvarPublicacoes()) {
    formularioPost.reset();
    mensagem.textContent = "Publicação criada com sucesso.";
    mostrarPublicacoes();
  } else {
    publicacoes.shift();
  }
});

carregarPublicacoes();
mostrarPublicacoes();
