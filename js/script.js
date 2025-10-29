document.addEventListener('DOMContentLoaded', () => {
    
    // =====================================
    // 1. Scroll Suave para Âncoras
    // =====================================
    const navLinks = document.querySelectorAll('.nav-list a');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Verifica se o link é para uma âncora na mesma página
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    // Usa a API nativa scrollIntoView com comportamento suave
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // =ESTA SEÇÃO DE BUSCA FOI REMOVIDA==============
    
    // =====================================
    // 2. Botão "Voltar ao Topo"
    // =====================================
    const backToTopButton = document.getElementById('back-to-top');

    // Função para mostrar/esconder o botão
    const toggleVisibility = () => {
        if (window.scrollY > 300) { // Mostra se a página for scrollada 300px
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    };

    // Função para scrollar para o topo
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Scroll suave
        });
    };

    window.addEventListener('scroll', toggleVisibility);
    backToTopButton.addEventListener('click', scrollToTop);
    
});

document.addEventListener('DOMContentLoaded', () => {
    
    // ... (Código do scroll suave e back-to-top aqui) ...
    
    // =====================================
    // 3. Botão de Impressão
    // =====================================
    const printButton = document.getElementById('print-button');
    if (printButton) {
        printButton.addEventListener('click', () => {
            window.print();
        });
    }

});