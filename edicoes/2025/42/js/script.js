// Função auxiliar para processar HTML/Markdown
const unwrap = (html) => {
    // Remove as tags <p> que o marked.js pode adicionar
    if (html && html.startsWith('<p>') && html.endsWith('</p>')) {
        return html.slice(3, -4).trim();
    }
    return html;
};

// ==========================================================
// FUNÇÃO PRINCIPAL
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // 0. Oculta todas as seções por padrão
    const pre_hide_sections = () => {
        document.querySelectorAll('.js-news-section').forEach(section => {
            section.style.display = 'none';
        });
    };
    pre_hide_sections(); 

    const carregarBoletim = () => {
        
        if (typeof BOLETIM_MARKDOWN_CONTENT === 'undefined') {
            console.error('Falha: A variável BOLETIM_MARKDOWN_CONTENT não foi definida.');
            document.getElementById('main-content').innerHTML = '<p style="text-align: center; color: red;">Não foi possível carregar o conteúdo. Verifique se o arquivo data.js está incluído.</p>';
            return;
        }

        const markdownContent = BOLETIM_MARKDOWN_CONTENT;

        try { // <--- BLOCO TRY INICIA AQUI
            
            const lines = markdownContent.split('\n');
            let globalMeta = {};
            const secoesMap = {};
            let currentSecaoId = null;
            let currentItem = {};

            // Helper para adicionar o item atual ao mapa de seções
            const finalizeItem = () => {
                if (currentSecaoId && currentItem.tipo) {
                    // Só adiciona se tiver título ou resumo válido
                    if (currentItem.titulo && currentItem.resumo) {
                        // Processa o resumo com marked.js antes de armazenar
                        currentItem.resumo = unwrap(marked.parse(currentItem.resumo.trim()));
                    } else if (currentItem.resumo) {
                         // Se tiver resumo, mas não título, processa o resumo
                         currentItem.resumo = unwrap(marked.parse(currentItem.resumo.trim()));
                         currentItem.titulo = 'Matéria Sem Título';
                    }
                    secoesMap[currentSecaoId].materias.push(currentItem);
                    currentItem = {}; // Reseta o item para a próxima matéria
                }
            };

            // 1. Parser Linha por Linha
            lines.forEach(line => {
                line = line.trim();
                if (!line) return;

                // Busca Metadados Globais (Início do arquivo)
                if (line.startsWith('edicao:') || line.startsWith('data:')) {
                    const parts = line.split(':');
                    globalMeta[parts[0].trim()] = parts[1].trim().replace(/['"]+/g, '');
                    return;
                }

                // Busca Início da Seção (## ID: Título)
                if (line.startsWith('##')) {
                    finalizeItem(); // Finaliza a matéria anterior (se houver)

                    const match = line.match(/^##\s*([^:]+):\s*(.+)$/);
                    if (match) {
                        currentSecaoId = match[1].trim();
                        if (!secoesMap[currentSecaoId]) {
                            secoesMap[currentSecaoId] = { titulo: match[2].trim(), materias: [] };
                        }
                    } else {
                        currentSecaoId = null; // Ignora se a seção estiver malformada
                    }
                    return;
                }

                // Busca Início de uma Nova Matéria (começa com 'tipo:')
                if (line.startsWith('tipo:')) {
                    finalizeItem(); // Finaliza a matéria anterior (se houver)
                }
                
                // Busca Campos de Matéria (Chave:Valor)
                if (currentSecaoId) {
                    const parts = line.split(':');
                    if (parts.length > 1) {
                        const key = parts[0].trim();
                        // O valor pode conter ':' (ex: em links/URLs no resumo), então juntamos o resto da linha
                        const value = parts.slice(1).join(':').trim().replace(/['"]+/g, '');
                        
                        if (['tipo', 'nomeImagem', 'nomeArquivo', 'titulo'].includes(key)) {
                            currentItem[key] = value;
                        } else if (key === 'resumo') {
                            // O resumo pode ter Markdown. Não processamos com marked.parse AGORA
                            currentItem[key] = value; 
                        }
                    }
                }
            });

            finalizeItem(); // Garante que a última matéria seja processada
            
            // Atualiza Metadados no HTML
            document.querySelector('.edition-number').textContent = `Edição ${globalMeta.edicao || 'XX'}`;
            document.querySelector('.edition-date').textContent = globalMeta.data || 'DD/MM/AAAA';
			document.title = document.title + ' ' + (globalMeta.edicao || 'XX') + ' de ' + (globalMeta.data || 'DD/MM/AAAA');


            // 2. Injeta o Conteúdo no HTML e controla a visibilidade
            Object.keys(secoesMap).forEach(secaoId => {
                const secao = secoesMap[secaoId];
                const container = document.getElementById(`content-${secaoId}`);
                const sectionElement = document.getElementById(secaoId);
                
                if (!container || !sectionElement) return; 

                if (secao.materias && secao.materias.length > 0) {
                    
                    let htmlContent = '';

                    secao.materias.forEach(item => {
                        
                        // ==========================================================
                        // INÍCIO DA ALTERAÇÃO PARA SUPORTAR LINKS EXTERNOS
                        // ==========================================================
                        // Verifica se nomeArquivo começa com 'http', 'https' ou '//'
                        const isExternal = item.nomeArquivo && (item.nomeArquivo.startsWith('http') || item.nomeArquivo.startsWith('//'));
                        
                        // Se for externo, usa o link direto. Caso contrário, assume que está em ./docs/
                        const linkPath = item.nomeArquivo 
                            ? (isExternal ? item.nomeArquivo : `./docs/${item.nomeArquivo}`) 
                            : '#';
                        // ==========================================================
                        // FIM DA ALTERAÇÃO
                        // ==========================================================
                        
                        if (item.tipo === 'card') {
                            const imagePath = item.nomeImagem ? `./img/${item.nomeImagem}` : './img/default.png'; 
                            
                            htmlContent += `
                                <article class="news-card">
                                    <div class="image-wrapper">
                                        <img src="${imagePath}" alt="${item.titulo}" class="card-image">
                                    </div>
                                    <div class="card-content">
                                        <h3 class="card-title">
                                            <a target="_blank" href="${linkPath}">${item.titulo || 'Sem Título'}</a>
                                        </h3>
                                        <div class="card-summary">${item.resumo || ''}</div>
                                        <a target="_blank" href="${linkPath}" class="read-more-btn">
                                            <i data-lucide="file-text"></i> Ler matéria completa
                                        </a>
                                    </div>
                                </article>
                            `;
                        } else if (item.tipo === 'lista') {
                            
                            htmlContent += `
                                <article class="list-item">
                                    <div class="item-content">
                                        <h3 class="item-title">
                                            <a target="_blank" href="${linkPath}">${item.titulo || 'Sem Título'}</a>
                                        </h3>
                                        <div class="item-summary">${item.resumo || ''}</div>
                                    </div>
                                    <a target="_blank" href="${linkPath}" class="list-link">
                                        <strong>Saiba Mais</strong>
                                    </a>
                                </div>
                            </article><br>
                        `;
                        }
                    });

                    container.innerHTML = htmlContent;
                    sectionElement.style.display = ''; // Exibe
					
					const header_item = document.createElement("li");
					header_item.innerHTML = '<a href="#'+secaoId+'">'+ secaoId.replace('-', ' ') +'</a>';
					document.getElementById("header-menu").appendChild(header_item);
                } else {
                    sectionElement.style.display = 'none'; // Oculta se vazio
                }
            });

            // Re-inicializa os ícones Lucide
            if (window.lucide) {
                window.lucide.createIcons();
            }

        } catch (error) { // <--- BLOCO CATCH FINALIZA AQUI
            console.error('Falha catastrófica ao processar o boletim:', error);
            document.getElementById('main-content').innerHTML = '<p style="text-align: center; color: red;">Houve um erro grave no processamento. Verifique a console do navegador (F12) para o erro.</p>';
        }
    }; // <--- FUNÇÃO carregarBoletim() FINALIZA AQUI

    carregarBoletim();


    // ... código de interação (mantido) ...
    document.querySelectorAll('.nav-list a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    const backToTopButton = document.getElementById('back-to-top');
    const toggleVisibility = () => {
        backToTopButton.style.display = window.scrollY > 300 ? 'block' : 'none';
    };
    window.addEventListener('scroll', toggleVisibility);
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    const printButton = document.getElementById('print-button');
    if (printButton) {
        printButton.addEventListener('click', () => {
            window.print();
        });
    }

});