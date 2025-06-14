import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Função para formatar telefone
function formatarTelefone(telefone) {
    const numero = telefone.replace(/\D/g, '');
    if (numero.length === 11) {
        return numero.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numero.length === 10) {
        return numero.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
}

// Função para aplicar máscara no telefone
function aplicarMascaraTelefone(input) {
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            if (value.length <= 2) {
                value = value.replace(/(\d{0,2})/, '($1');
            } else if (value.length <= 7) {
                value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
            } else {
                value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
            }
        }
        e.target.value = value;
    });
}

// Função para validar email
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Função para validar telefone
function validarTelefone(telefone) {
    const numero = telefone.replace(/\D/g, '');
    return numero.length >= 10 && numero.length <= 11;
}

// Função para mostrar toast
function mostrarToast(tipo, titulo, mensagem) {
    const toastContainer = document.querySelector('.toast-container');
    const toastId = `${tipo}Toast${Date.now()}`;
    
    const toastHTML = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${tipo === 'success' ? 'bg-success' : 'bg-danger'} text-white">
                <i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2"></i>
                <strong class="me-auto">${titulo}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${mensagem}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toast = new bootstrap.Toast(document.getElementById(toastId));
    toast.show();
    
    // Remove o toast do DOM após ser ocultado
    document.getElementById(toastId).addEventListener('hidden.bs.toast', function() {
        this.remove();
    });
}

// Função para salvar cliente no Firestore
async function salvarClienteFirestore(dadosCliente) {
    try {
        const docRef = await addDoc(collection(window.db, "clientes"), {
            ...dadosCliente,
            dataCadastro: serverTimestamp(),
            pontos: 0,
            ativo: true,
            nivel: 'Bronze' // Nível inicial do programa de pontos
        });
        
        console.log("Cliente cadastrado com ID: ", docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Erro ao cadastrar cliente: ", error);
        return { success: false, error: error.message };
    }
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('cadastroForm');
    const telefoneInput = document.getElementById('telefone');
    const togglePassword = document.getElementById('togglePassword');
    const senhaInput = document.getElementById('senha');
    const eyeIcon = document.getElementById('eyeIcon');
    
    // Aplicar máscara no telefone
    aplicarMascaraTelefone(telefoneInput);
    
    // Toggle para mostrar/ocultar senha
    togglePassword.addEventListener('click', function() {
        const type = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
        senhaInput.setAttribute('type', type);
        
        if (type === 'password') {
            eyeIcon.classList.remove('fa-eye-slash');
            eyeIcon.classList.add('fa-eye');
        } else {
            eyeIcon.classList.remove('fa-eye');
            eyeIcon.classList.add('fa-eye-slash');
        }
    });
    
    // Função para verificar se email já existe
    async function verificarEmailExistente(email) {
        try {
            const q = query(collection(window.db, "clientes"), where("email", "==", email.toLowerCase()));
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (error) {
            console.error("Erro ao verificar email:", error);
            return false;
        }
    }

    // Função para verificar se telefone já existe
    async function verificarTelefoneExistente(telefone) {
        try {
            const q = query(collection(window.db, "clientes"), where("telefone", "==", telefone));
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (error) {
            console.error("Erro ao verificar telefone:", error);
            return false;
        }
    }

    // Validação e envio do formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Obter valores dos campos
        const nome = document.getElementById('nome').value.trim();
        const sobrenome = document.getElementById('sobrenome').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value;
        const termos = document.getElementById('termos').checked;
        
        let isValid = true;
        
        // Aplicar classes de validação do Bootstrap APENAS no submit
        form.classList.add('was-validated');
        
        // Validações customizadas básicas
        if (!validarEmail(email)) {
            mostrarErroCampo('email', 'Por favor, informe um e-mail válido.');
            isValid = false;
        } else {
            document.getElementById('email').classList.remove('is-invalid');
            document.getElementById('email').classList.add('is-valid');
        }
        
        if (!validarTelefone(telefone)) {
            mostrarErroCampo('telefone', 'Por favor, informe um telefone válido.');
            isValid = false;
        } else {
            document.getElementById('telefone').classList.remove('is-invalid');
            document.getElementById('telefone').classList.add('is-valid');
        }
        
        // Verificar se o formulário é válido
        if (form.checkValidity() && isValid) {
            // Desabilitar botão de envio
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Verificando dados...';
            
            // Verificar duplicatas APENAS no momento do envio
            const emailExiste = await verificarEmailExistente(email);
            const telefoneExiste = await verificarTelefoneExistente(telefone);
            
            if (emailExiste) {
                mostrarErroCampo('email', 'Este e-mail já está cadastrado no sistema.');
                mostrarToast('error', 'Erro!', 'E-mail já cadastrado. Tente fazer login ou use outro e-mail.');
                isValid = false;
            }
            
            if (telefoneExiste) {
                mostrarErroCampo('telefone', 'Este telefone já está cadastrado no sistema.');
                mostrarToast('error', 'Erro!', 'Telefone já cadastrado. Use outro número de telefone.');
                isValid = false;
            }
            
            if (isValid) {
                // Atualizar texto do botão
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Cadastrando...';
                
                // Preparar dados do cliente
                const dadosCliente = {
                    nome: nome,
                    sobrenome: sobrenome,
                    nomeCompleto: `${nome} ${sobrenome}`,
                    telefone: telefone,
                    email: email.toLowerCase(),
                    senha: senha // IMPORTANTE: Em produção, criptografe a senha!
                };
                
                // Salvar no Firestore
                const resultado = await salvarClienteFirestore(dadosCliente);
                
                if (resultado.success) {
                    mostrarToast('success', 'Sucesso!', 'Bem-vindo ao Programa de Pontos! Seu cadastro foi realizado com sucesso.');
                    form.reset();
                    form.classList.remove('was-validated');
                    
                    // Remover classes de validação
                    const inputs = form.querySelectorAll('.form-control');
                    inputs.forEach(input => {
                        input.classList.remove('is-valid', 'is-invalid');
                    });
                } else {
                    mostrarToast('error', 'Erro!', `Erro ao cadastrar: ${resultado.error}`);
                }
            }
            
            // Reabilitar botão
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        } else {
            mostrarToast('error', 'Erro!', 'Por favor, corrija os campos destacados antes de continuar.');
        }
    });
    
    // Remover classe de validação quando o usuário começar a digitar
    const inputs = form.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.classList.contains('is-invalid')) {
                limparErroCampo(this.id);
            }
        });
    });
});