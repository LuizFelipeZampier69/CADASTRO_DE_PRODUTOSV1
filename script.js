"use strict";



class Produto {
    #preco;
    #quantidade;

    constructor(nome, preco, quantidade) {
        const nomeValidado = typeof nome === "string" ? nome.trim() : "";
        const precoNum = Number(preco);
        const quantidadeNum = Number(quantidade);

        if (!nomeValidado) {
            throw new Error("Informe um nome válido para o produto.");
        }

        if (nomeValidado.length > 100) {
            throw new Error("O nome deve ter no máximo 100 caracteres.");
        }

        if (!Number.isFinite(precoNum) || precoNum <= 0) {
            throw new Error("O preço deve ser um número maior que zero.");
        }

        if (!Number.isSafeInteger(quantidadeNum) || quantidadeNum <= 0) {
            throw new Error("A quantidade deve ser um número inteiro maior que zero.");
        }

        this.nome = nomeValidado;
        this.#preco = Math.round((precoNum + Number.EPSILON) * 100) / 100;
        this.#quantidade = quantidadeNum;
    }

    get preco() {
        return this.#preco;
    }

    get quantidade() {
        return this.#quantidade;
    }

    calcularSubtotal() {
        return Math.round(
            (this.#preco * this.#quantidade + Number.EPSILON) * 100
        ) / 100;
    }
}


const CHAVE_STORAGE = "produtos_estoque";

const listaDeProdutos = [];

let indiceEdicao = null;

const formProduto = document.getElementById("produto-form");
const campoNome = document.getElementById("nome");
const campoPreco = document.getElementById("preco");
const campoQuantidade = document.getElementById("quantidade");

const botaoSalvar = document.getElementById("botao-salvar");
const botaoCancelar = document.getElementById("botao-cancelar");
const botaoLimpar = document.getElementById("limpar-tabela");

const tabelaBody = document.getElementById("lista-produtos");
const elementoTotal = document.getElementById("total-estoque");
const elementoQuantidade = document.getElementById("quantidade-produtos");
const mensagem = document.getElementById("mensagem");
const mensagemVazia = document.getElementById("mensagem-vazia");
const campoPesquisa = document.getElementById("pesquisa");
const tituloFormulario = document.getElementById("titulo-formulario");

const formatoMoeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
});



function formatarMoeda(valor) {
    return formatoMoeda.format(valor);
}

function mostrarMensagem(texto, tipo = "sucesso") {
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
}

function limparMensagem() {
    mensagem.textContent = "";
    mensagem.className = "mensagem";
}

function salvarNoLocalStorage() {
    try {
        const dados = listaDeProdutos.map(produto => ({
            nome: produto.nome,
            preco: produto.preco,
            quantidade: produto.quantidade
        }));

        localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados));
        return true;
    } catch (erro) {
        console.error("Erro ao salvar produtos:", erro);
        mostrarMensagem(
            "Não foi possível salvar os dados. Verifique o armazenamento do navegador.",
            "erro"
        );
        return false;
    }
}



function carregarDoLocalStorage() {
    try {
        const dadosSalvos = localStorage.getItem(CHAVE_STORAGE);

        if (dadosSalvos === null) {
            return;
        }

        const dados = JSON.parse(dadosSalvos);

        if (!Array.isArray(dados)) {
            throw new Error("O formato dos dados salvos é inválido.");
        }

        const produtosCarregados = dados.map(dado => {
            return new Produto(
                dado.nome,
                dado.preco,
                dado.quantidade
            );
        });

        listaDeProdutos.push(...produtosCarregados);
    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
        mostrarMensagem(
            "Não foi possível carregar os produtos salvos. Os dados inválidos não foram carregados.",
            "erro"
        );
    }
}



formProduto.addEventListener("submit", function (event) {
    event.preventDefault();
    limparMensagem();

    const nome = campoNome.value.trim();
    const preco = campoPreco.value;
    const quantidade = campoQuantidade.value;

  
    if (!nome) {
        mostrarMensagem("Por favor, informe um nome válido.", "erro");
        campoNome.focus();
        return;
    }

    if (nome.length > 100) {
        mostrarMensagem("O nome deve ter no máximo 100 caracteres.", "erro");
        campoNome.focus();
        return;
    }

    if (preco.trim() === "" || !Number.isFinite(Number(preco)) || Number(preco) <= 0) {
        mostrarMensagem("O preço deve ser maior que zero.", "erro");
        campoPreco.focus();
        return;
    }

    if (
        quantidade.trim() === "" ||
        !Number.isSafeInteger(Number(quantidade)) ||
        Number(quantidade) <= 0
    ) {
        mostrarMensagem(
            "A quantidade deve ser um número inteiro maior que zero.",
            "erro"
        );
        campoQuantidade.focus();
        return;
    }

    let produto;

    try {
        produto = new Produto(nome, preco, quantidade);
    } catch (erro) {
        mostrarMensagem(erro.message, "erro");
        return;
    }

   
    if (indiceEdicao === null) {
        listaDeProdutos.push(produto);

        if (!salvarNoLocalStorage()) {
            listaDeProdutos.pop();
            return;
        }

        mostrarMensagem("Produto cadastrado com sucesso.");
    } else {
        
        const indice = indiceEdicao;
        const produtoAnterior = listaDeProdutos[indice];

        if (!produtoAnterior) {
            cancelarEdicao();
            mostrarMensagem("O produto selecionado não foi encontrado.", "erro");
            return;
        }

        listaDeProdutos[indice] = produto;

        if (!salvarNoLocalStorage()) {
            listaDeProdutos[indice] = produtoAnterior;
            return;
        }

        mostrarMensagem("Produto atualizado com sucesso.");
    }

    cancelarEdicao(false);
    formProduto.reset();
    renderizarTabela();
    atualizarTotalEstoque();
});


function prepararEdicao(index) {
    const produto = listaDeProdutos[index];

    if (!produto) {
        mostrarMensagem("Produto não encontrado.", "erro");
        return;
    }

    indiceEdicao = index;

    campoNome.value = produto.nome;
    campoPreco.value = produto.preco;
    campoQuantidade.value = produto.quantidade;

    botaoSalvar.textContent = "Salvar Alterações";
    botaoCancelar.hidden = false;
    tituloFormulario.textContent = "Editar Produto";

    limparMensagem();

    campoNome.focus();

    document.querySelector(".card").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function cancelarEdicao(limparCampos = true) {
    indiceEdicao = null;

    botaoSalvar.textContent = "Adicionar Produto";
    botaoCancelar.hidden = true;
    tituloFormulario.textContent = "Cadastrar Produto";

    if (limparCampos) {
        formProduto.reset();
    }
}

botaoCancelar.addEventListener("click", function () {
    cancelarEdicao();
    limparMensagem();
});



function renderizarTabela() {
    tabelaBody.replaceChildren();

    const termo = campoPesquisa.value.trim().toLocaleLowerCase("pt-BR");

    const produtosVisiveis = listaDeProdutos
        .map((produto, index) => ({ produto, index }))
        .filter(({ produto }) => {
            return produto.nome.toLocaleLowerCase("pt-BR").includes(termo);
        });

    produtosVisiveis.forEach(({ produto, index }) => {
        const linha = document.createElement("tr");

        const celulaNome = document.createElement("td");
        celulaNome.textContent = produto.nome;

        const celulaPreco = document.createElement("td");
        celulaPreco.textContent = formatarMoeda(produto.preco);

        const celulaQuantidade = document.createElement("td");
        celulaQuantidade.textContent = produto.quantidade;

        const celulaSubtotal = document.createElement("td");
        celulaSubtotal.textContent = formatarMoeda(produto.calcularSubtotal());

        const celulaAcoes = document.createElement("td");

        const botaoEditar = document.createElement("button");
        botaoEditar.type = "button";
        botaoEditar.className = "btn-editar";
        botaoEditar.textContent = "Editar";
        botaoEditar.setAttribute("aria-label", `Editar ${produto.nome}`);

        botaoEditar.addEventListener("click", function () {
            prepararEdicao(index);
        });

        const botaoRemover = document.createElement("button");
        botaoRemover.type = "button";
        botaoRemover.className = "btn-remover";
        botaoRemover.textContent = "Remover";
        botaoRemover.setAttribute("aria-label", `Remover ${produto.nome}`);

        botaoRemover.addEventListener("click", function () {
            removerProduto(index);
        });

        celulaAcoes.append(botaoEditar, botaoRemover);

        linha.append(
            celulaNome,
            celulaPreco,
            celulaQuantidade,
            celulaSubtotal,
            celulaAcoes
        );

        tabelaBody.appendChild(linha);
    });

    mensagemVazia.classList.toggle(
        "oculta",
        produtosVisiveis.length > 0
    );

    if (produtosVisiveis.length === 0) {
        mensagemVazia.textContent = termo
            ? "Nenhum produto corresponde à pesquisa."
            : "Nenhum produto cadastrado.";
    }
}



function atualizarTotalEstoque() {
    const valorTotal = listaDeProdutos.reduce(
        (total, produto) => total + produto.calcularSubtotal(),
        0
    );

    elementoTotal.textContent = formatarMoeda(valorTotal);
    elementoQuantidade.textContent = listaDeProdutos.length;
}



function removerProduto(index) {
    const produto = listaDeProdutos[index];

    if (!produto) {
        mostrarMensagem("Produto não encontrado.", "erro");
        return;
    }

    const confirmar = window.confirm(
        `Deseja realmente remover o produto "${produto.nome}"?`
    );

    if (!confirmar) {
        return;
    }

    const removido = listaDeProdutos.splice(index, 1)[0];

    // Se o produto removido estava em edição, cancela a edição.
    if (indiceEdicao === index) {
        cancelarEdicao();
    } else if (indiceEdicao !== null && indiceEdicao > index) {
        indiceEdicao--;
    }

    if (!salvarNoLocalStorage()) {
        listaDeProdutos.splice(index, 0, removido);

        if (indiceEdicao !== null && indiceEdicao >= index) {
            indiceEdicao++;
        }

        renderizarTabela();
        atualizarTotalEstoque();
        return;
    }

    renderizarTabela();
    atualizarTotalEstoque();
    mostrarMensagem("Produto removido com sucesso.");
}

// ========================================
// DELETE - LIMPAR TODOS OS PRODUTOS
// ========================================

botaoLimpar.addEventListener("click", function () {
    if (listaDeProdutos.length === 0) {
        mostrarMensagem("Não existem produtos para remover.", "erro");
        return;
    }

    const confirmar = window.confirm(
        "Deseja realmente excluir todos os produtos do estoque?"
    );

    if (!confirmar) {
        return;
    }

    const anteriores = listaDeProdutos.slice();

    listaDeProdutos.length = 0;
    cancelarEdicao();

    if (!salvarNoLocalStorage()) {
        listaDeProdutos.push(...anteriores);
        renderizarTabela();
        atualizarTotalEstoque();
        return;
    }

    renderizarTabela();
    atualizarTotalEstoque();
    mostrarMensagem("Todos os produtos foram removidos.");
});



campoPesquisa.addEventListener("input", renderizarTabela);


carregarDoLocalStorage();
renderizarTabela();
atualizarTotalEstoque();