// Importações do Firebase
import { collection, addDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
// 
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('cadastroForm');
    const togglePassword = document.getElementById('togglePassword');
    const senhaInput = document.getElementById('senha');
    const eyeIcon = document.getElementById('eyeIcon');

    // Remove validação automática dos campos
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('invalid', function(e) {
            e.preventDefault(); // Impede a validação automática
        });
    });

    // Toggle para mostrar/ocultar senha
    togglePassword.addEventListener('click', function() {
        const type = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
        senhaInput.setAttribute('type', type);
        
        eyeIcon.classList.toggle('fa-eye');
        eyeIcon.classList.toggle('fa-eye-slash');
    });

    // Máscara para telefone
    const telefoneInput = document.getElementById('telefone');
    telefoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            if (value.length < 14) {
                value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
            }
        }
        e.target.value = value;
    });

    // Manipulação do formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validação manual
        let isValid = true;
        const nome = document.getElementById('nome').value.trim();
        const sobrenome = document.getElementById('sobrenome').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value;
        const termos = document.getElementById('termos').checked;

        // Validações
        if (!nome) isValid = false;
        if (!sobrenome) isValid = false;
        if (!telefone) isValid = false;
        if (!email || !isValidEmail(email)) isValid = false;
        if (!senha || senha.length < 6) isValid = false;
        if (!termos) isValid = false;

        if (!isValid) {
            // Adiciona a classe was-validated para mostrar os erros
            form.classList.add('was-validated');
            
            // Foca no primeiro campo inválido
            const firstInvalidField = form.querySelector(':invalid');
            if (firstInvalidField) {
                firstInvalidField.focus();
            }
            
            showToast('Por favor, corrija os erros no formulário.', 'error');
            return;
        }

        // Se chegou aqui, o formulário é válido
        const formData = {
            nome: nome,
            sobrenome: sobrenome,
            telefone: telefone,
            email: email.toLowerCase(),
            senha: senha,
            dataCadastro: new Date(),
            pontos: 0,
            ativo: true
        };

        try {
            // Verificar se o email já existe
            const emailQuery = query(
                collection(window.db, 'clientes'), 
                where('email', '==', formData.email)
            );
            const emailSnapshot = await getDocs(emailQuery);
            
            if (!emailSnapshot.empty) {
                showToast('Este e-mail já está cadastrado!', 'error');
                return;
            }

            // Verificar se o telefone já existe
            const telefoneQuery = query(
                collection(window.db, 'clientes'), 
                where('telefone', '==', formData.telefone)
            );
            const telefoneSnapshot = await getDocs(telefoneQuery);
            
            if (!telefoneSnapshot.empty) {
                showToast('Este telefone já está cadastrado!', 'error');
                return;
            }

            // Salvar no Firebase
            const docRef = await addDoc(collection(window.db, 'clientes'), formData);
            
            showToast('Cadastro realizado com sucesso! Bem-vindo ao Programa de Pontos!', 'success');
            
            // Limpar formulário
            form.reset();
            form.classList.remove('was-validated');
            
        } catch (error) {
            console.error('Erro ao cadastrar cliente:', error);
            showToast('Erro ao realizar cadastro. Tente novamente.', 'error');
        }
    });

    // Função para validar email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Função para mostrar toast
    function showToast(message, type = 'info') {
        const toastContainer = document.querySelector('.toast-container');
        const toastId = 'toast-' + Date.now();
        
        const bgClass = type === 'success' ? 'bg-success' : 
                       type === 'error' ? 'bg-danger' : 'bg-info';
        
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 5000
        });
        
        toast.show();
        
        // Remove o elemento do DOM após ser ocultado
        toastElement.addEventListener('hidden.bs.toast', function() {
            toastElement.remove();
        });
    }
});