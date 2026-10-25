// Protótipo: os dados ficam no localStorage do navegador.

const CHAVE = 'estante:v2';
const NOMES = { alice: 'Alice', juan: 'Juan' };
const ARTIGO = { alice: 'à', juan: 'ao' };

// Contagem de volumes da edição Panini (Brasil); dá pra ajustar aqui ou recriar a coleção.
function jojo(posse) {
  const partes = [
    ['Phantom Blood', 3], ['Battle Tendency', 4], ['Stardust Crusaders', 10],
    ['Diamond is Unbreakable', 12], ['Golden Wind', 10], ['Stone Ocean', 11],
    ['Steel Ball Run', 24], ['JoJolion', 27],
  ];
  return {
    id: 'jojo',
    nome: "JoJo's Bizarre Adventure",
    edicao: 'Edição brasileira · Panini',
    partes: partes.map(([titulo, volumes], i) => ({
      titulo,
      volumes,
      coleciona: posse[i] !== undefined,
      tem: posse[i] === 'todos' ? intervalo(volumes) : (posse[i] || []),
    })),
  };
}

const EXEMPLO = {
  // Juan coleciona até a parte 6.
  juan: [jojo(['todos', 'todos', 'todos', [1, 2, 6], [], [8, 9, 10]])],
  alice: [],
};

let dados = carregar();
let pessoa = lerPreferencia('estante:aba', 'juan');
let euSou = lerPreferencia('estante:quem', 'alice');

function intervalo(n) {
  return Array.from({ length: n }, (_, i) => i + 1);
}

function carregar() {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo) return JSON.parse(salvo);
  } catch (e) { /* sem storage: usa o exemplo */ }
  return structuredClone(EXEMPLO);
}

function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch (e) { /* ignora */ }
}

function lerPreferencia(chave, padrao) {
  try { return localStorage.getItem(chave) || padrao; } catch (e) { return padrao; }
}
function guardarPreferencia(chave, valor) {
  try { localStorage.setItem(chave, valor); } catch (e) { /* ignora */ }
}

function el(tag, classe, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

// Parte N usa lombada-N; depois da 8, recomeça.
function corDaParte(i) {
  return 'es-cor-' + ((i % 8) + 1);
}

function render() {
  document.body.dataset.pessoa = pessoa;
  document.querySelectorAll('.es-aba').forEach(b => {
    const sel = b.dataset.pessoa === pessoa;
    b.setAttribute('aria-selected', sel);
    b.tabIndex = sel ? 0 : -1;
  });
  document.getElementById('quem-sou').value = euSou;
  document.getElementById('conteudo').setAttribute('aria-labelledby', 'aba-' + pessoa);

  const main = document.getElementById('conteudo');
  main.innerHTML = '';
  const colecoes = dados[pessoa] || [];
  const minha = pessoa === euSou;

  if (!colecoes.length) {
    main.appendChild(renderVazio(minha));
    return;
  }
  colecoes.forEach(col => main.appendChild(renderColecao(col, minha)));
  if (minha) {
    const add = el('button', 'es-botao', 'Adicionar coleção');
    add.onclick = abrirDialogo;
    main.appendChild(add);
  }
}

function renderVazio(minha) {
  const box = el('section', 'es-vazio');
  box.appendChild(el('h2', 'es-titulo-secao', minha ? 'Sua estante está vazia' : `A estante ${pessoa === 'alice' ? 'da' : 'do'} ${NOMES[pessoa]} está vazia`));
  box.appendChild(el('p', '', minha
    ? 'Adicione uma coleção e marque os volumes que você tem.'
    : `Quando ${pessoa === 'alice' ? 'a' : 'o'} ${NOMES[pessoa]} adicionar uma coleção, ela aparece aqui.`));
  if (minha) {
    const add = el('button', 'es-botao es-botao-primario', 'Adicionar coleção');
    add.onclick = abrirDialogo;
    box.appendChild(add);
  }
  return box;
}

function renderColecao(col, minha) {
  const sec = el('section', 'es-colecao');
  sec.appendChild(renderCabecalho(col, minha));
  sec.appendChild(renderLegenda());

  const estante = el('div', 'es-estante');
  col.partes.forEach((parte, pi) => estante.appendChild(renderPrateleira(col, parte, pi, minha)));
  sec.appendChild(estante);

  sec.appendChild(renderPresentes(col, minha));
  return sec;
}

function renderCabecalho(col, minha) {
  const coleciona = col.partes.filter(p => p.coleciona);
  const total = coleciona.reduce((s, p) => s + p.volumes, 0);
  const tem = coleciona.reduce((s, p) => s + p.tem.length, 0);

  const box = el('header', 'es-painel es-cabecalho');
  const linha = el('div', 'es-cabecalho-linha');
  const titulos = el('div');
  if (col.edicao) titulos.appendChild(el('div', 'es-edicao', col.edicao));
  titulos.appendChild(el('h2', 'es-titulo-colecao', col.nome));
  linha.appendChild(titulos);

  if (minha) {
    const acoes = el('div', 'es-acoes-colecao');
    const rm = el('button', 'es-botao', 'Remover coleção');
    rm.onclick = () => {
      if (!confirm(`Remover "${col.nome}" da sua estante?`)) return;
      dados[pessoa] = dados[pessoa].filter(c => c !== col);
      salvar(); render();
    };
    acoes.appendChild(rm);
    linha.appendChild(acoes);
  }
  box.appendChild(linha);

  // "Coleciona até a Parte 6." quando as partes colecionadas vão da 1 até alguma.
  if (col.partes.length > 1) {
    const ultima = col.partes.map(p => p.coleciona).lastIndexOf(true);
    const contiguo = col.partes.slice(0, ultima + 1).every(p => p.coleciona);
    let meta;
    if (ultima < 0) meta = 'Não coleciona nenhuma parte.';
    else if (ultima === col.partes.length - 1 && contiguo) meta = 'Coleciona todas as partes.';
    else if (contiguo) meta = `Coleciona até a Parte ${ultima + 1}.`;
    else meta = `Coleciona ${coleciona.length} de ${col.partes.length} partes.`;
    box.appendChild(el('p', 'es-meta', meta));
  }

  const prog = el('div', 'es-progresso');
  const barra = el('div', 'es-barra');
  barra.setAttribute('role', 'progressbar');
  barra.setAttribute('aria-valuemin', 0);
  barra.setAttribute('aria-valuemax', total);
  barra.setAttribute('aria-valuenow', tem);
  barra.setAttribute('aria-label', 'Volumes que tem');
  const preench = el('span');
  preench.style.width = total ? (tem / total * 100) + '%' : '0';
  barra.appendChild(preench);
  prog.appendChild(barra);
  const cont = el('strong', '', `${tem} de ${total}`);
  prog.appendChild(cont);
  if (total && tem === total) prog.appendChild(el('span', 'es-completa es-legenda-texto', 'completa'));
  box.appendChild(prog);
  return box;
}

function renderLegenda() {
  const ul = el('ul', 'es-legenda');
  [['tem', 'tem'], ['falta', 'falta'], ['fora', 'fora da coleção']].forEach(([estado, rotulo]) => {
    const li = el('li', 'es-legenda-texto');
    const amostra = el('span', `es-lombada es-cor-3 ${estado}`);
    amostra.setAttribute('aria-hidden', 'true');
    li.append(amostra, rotulo);
    ul.appendChild(li);
  });
  return ul;
}

function renderPrateleira(col, parte, pi, minha) {
  const prat = el('section', `es-prateleira ${corDaParte(pi)}`);
  const varias = col.partes.length > 1;
  const nomeParte = parte.titulo || col.nome;

  const topo = el('div', 'es-prateleira-topo');
  if (varias) topo.appendChild(el('span', 'es-rotulo-parte', `Parte ${pi + 1}`));
  topo.appendChild(el('span', 'es-nome-parte', nomeParte));
  topo.appendChild(el('span', 'es-contagem es-legenda-texto',
    parte.coleciona ? (parte.tem.length === parte.volumes ? 'completa' : `${parte.tem.length} de ${parte.volumes}`) : 'fora da coleção'));
  if (minha && varias) {
    const alt = el('button', 'es-alternar', parte.coleciona ? 'Não coleciono' : 'Coleciono');
    alt.onclick = () => { parte.coleciona = !parte.coleciona; salvar(); render(); };
    topo.appendChild(alt);
  }
  prat.appendChild(topo);

  const nicho = el('div', 'es-nicho');
  for (let v = 1; v <= parte.volumes; v++) {
    const estado = !parte.coleciona ? 'fora' : parte.tem.includes(v) ? 'tem' : 'falta';
    const clicavel = minha && parte.coleciona;
    const lombada = el(clicavel ? 'button' : 'div', `es-lombada ${estado}`);
    lombada.appendChild(el('span', 'es-numero', String(v)));
    if (clicavel) {
      lombada.type = 'button';
      lombada.setAttribute('aria-pressed', estado === 'tem');
      lombada.setAttribute('aria-label', `${nomeParte}, volume ${v}`);
      lombada.onclick = () => {
        parte.tem = parte.tem.includes(v)
          ? parte.tem.filter(x => x !== v)
          : [...parte.tem, v].sort((a, b) => a - b);
        salvar(); render();
        document.querySelector(`[aria-label="${CSS.escape(nomeParte)}, volume ${v}"]`)?.focus();
      };
    } else {
      lombada.setAttribute('role', 'img');
      lombada.setAttribute('aria-label', `${nomeParte}, volume ${v}, ${estado === 'fora' ? 'fora da coleção' : estado}`);
    }
    nicho.appendChild(lombada);
  }
  prat.appendChild(nicho);
  return prat;
}

function renderPresentes(col, minha) {
  const box = el('section', 'es-painel es-presentes');
  box.appendChild(el('h2', 'es-titulo-secao', minha ? 'O que falta pra você' : `Dá pra dar de presente ${ARTIGO[pessoa]} ${NOMES[pessoa]}`));

  const faltando = col.partes
    .map((p, i) => ({ p, i, vols: p.coleciona ? intervalo(p.volumes).filter(v => !p.tem.includes(v)) : [] }))
    .filter(x => x.vols.length);

  if (!faltando.length) {
    box.appendChild(el('p', 'es-meta', 'Nada, a coleção está completa.'));
    return box;
  }
  const ul = el('ul');
  faltando.forEach(({ p, i, vols }) => {
    const li = el('li', corDaParte(i));
    if (col.partes.length > 1) li.appendChild(el('span', 'es-rotulo-parte', `Parte ${i + 1}`));
    li.appendChild(el('span', 'es-nome-parte', p.titulo || col.nome));
    const chips = el('div', 'es-chips');
    vols.forEach(v => chips.appendChild(el('span', 'es-chip', String(v))));
    li.appendChild(chips);
    ul.appendChild(li);
  });
  box.appendChild(ul);
  return box;
}

// --- Abas: clique e setas ---
const abas = [...document.querySelectorAll('.es-aba')];
abas.forEach((b, i) => {
  b.onclick = () => trocarAba(b.dataset.pessoa);
  b.onkeydown = e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const prox = abas[(i + (e.key === 'ArrowRight' ? 1 : -1) + abas.length) % abas.length];
    trocarAba(prox.dataset.pessoa);
    prox.focus();
  };
});

function trocarAba(p) {
  pessoa = p;
  guardarPreferencia('estante:aba', p);
  render();
}

document.getElementById('quem-sou').onchange = e => {
  euSou = e.target.value;
  guardarPreferencia('estante:quem', euSou);
  render();
};

// --- Adicionar coleção ---
const dialogo = document.getElementById('dialogo-colecao');
const form = document.getElementById('form-colecao');

function abrirDialogo() {
  form.reset();
  dialogo.showModal();
}
document.getElementById('cancelar-colecao').onclick = () => dialogo.close();

// "Phantom Blood = 3" por linha; uma linha só sem nome vira coleção sem partes.
function lerPartes(texto) {
  return texto.split('\n')
    .map(l => l.trim()).filter(Boolean)
    .map(l => {
      const i = l.lastIndexOf('=');
      const titulo = i < 0 ? '' : l.slice(0, i).trim();
      const volumes = parseInt(i < 0 ? l : l.slice(i + 1), 10);
      return { titulo, volumes, coleciona: true, tem: [] };
    })
    .filter(p => p.volumes > 0);
}

form.onsubmit = e => {
  const partes = lerPartes(form.partes.value);
  if (!partes.length) {
    e.preventDefault();
    alert('Use uma linha por parte, no formato "Phantom Blood = 3".');
    return;
  }
  dados[pessoa] = dados[pessoa] || [];
  dados[pessoa].push({
    id: String(Date.now()),
    nome: form.nome.value.trim(),
    edicao: form.edicao.value.trim(),
    partes,
  });
  salvar();
  render();
};

document.getElementById('restaurar').onclick = () => {
  if (!confirm('Apagar as marcações salvas neste navegador e voltar ao exemplo?')) return;
  dados = structuredClone(EXEMPLO);
  salvar(); render();
};

render();
