const formulario = document.querySelector("#form-login");
const campoEmail = document.querySelector("#email");
const campoSenha = document.querySelector("#senha");
const botaoMostrarSenha = document.querySelector("#mostrar-senha");
const mensagem = document.querySelector("#login-message");

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

  if (!campoEmail.validity.valid) {
    mensagem.textContent =
      "Digite um e-mail válido.";

    mensagem.className =
      "login-message-error";

    campoEmail.focus();

    return;
  }

  if (campoSenha.value.length < 6) {
    mensagem.textContent =
      "A senha precisa ter pelo menos 6 caracteres.";

    mensagem.className =
      "login-message-error";

    campoSenha.focus();

    return;
  }

  mensagem.textContent =
    "Login realizado com sucesso.";

  mensagem.className =
    "login-message-success";

  setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 800);
});

[campoEmail, campoSenha].forEach((campo) => {
  campo.addEventListener("input", () => {
    mensagem.textContent = "";
    mensagem.className = "";
  });
});