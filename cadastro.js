const formulario = document.querySelector("#form-cadastro");

const campoNome = document.querySelector("#nome");
const campoEmail = document.querySelector("#email");
const campoSenha = document.querySelector("#senha");
const campoConfirmarSenha = document.querySelector("#confirmar-senha");

const botaoMostrarSenha = document.querySelector("#mostrar-senha");
const mensagem = document.querySelector("#cadastro-message");

botaoMostrarSenha.addEventListener("click", () => {
  const senhaVisivel = campoSenha.type === "text";

  campoSenha.type =
    senhaVisivel ? "password" : "text";

  botaoMostrarSenha.textContent =
    senhaVisivel ? "Mostrar" : "Ocultar";
});

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  mensagem.textContent = "";
  mensagem.className = "";

  if (campoNome.value.trim().length < 2) {
    mensagem.textContent = "Digite seu nome.";

    mensagem.className = "login-message-error";

    campoNome.focus();

    return;
  }

  if (!campoEmail.validity.valid) {
    mensagem.textContent = "Digite um e-mail válido.";

    mensagem.className = "login-message-error";

    campoEmail.focus();

    return;
  }

  if (campoSenha.value.length < 6) {
    mensagem.textContent =
      "A senha precisa ter pelo menos 6 caracteres.";

    mensagem.className = "login-message-error";

    campoSenha.focus();

    return;
  }

  if (campoSenha.value !== campoConfirmarSenha.value) {
    mensagem.textContent = "As senhas não são iguais.";

    mensagem.className = "login-message-error";

    campoConfirmarSenha.focus();

    return;
  }

  mensagem.textContent = "Conta criada com sucesso.";

  mensagem.className = "login-message-success";

  setTimeout(() => {
    window.location.href = "login.html";
  }, 1000);
});