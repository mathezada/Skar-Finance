(function () {
  "use strict";

  const $ = (selector) =>
    document.querySelector(selector);

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setError(input, message) {
    if (!input) return;

    const field =
      input.closest(".field");

    const error =
      document.getElementById(
        `${input.id}Error`
      );

    field?.classList.toggle(
      "invalid",
      Boolean(message)
    );

    input.setAttribute(
      "aria-invalid",
      String(Boolean(message))
    );

    if (error) {
      error.textContent = message;
    }
  }

  function isValidEmail(input) {
    const valid =
      emailPattern.test(
        input.value.trim()
      );

    setError(
      input,
      valid
        ? ""
        : "Digite um e-mail válido."
    );

    return valid;
  }

  /*
   * MOSTRAR E OCULTAR SENHA
   */

  document
    .querySelectorAll(
      ".password-toggle"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          const input =
            button.parentElement
              .querySelector("input");

          const showing =
            input.type === "text";

          input.type =
            showing
              ? "password"
              : "text";

          button.textContent =
            showing ? "◉" : "◌";

          button.setAttribute(
            "aria-label",
            showing
              ? "Mostrar senha"
              : "Ocultar senha"
          );

          button.setAttribute(
            "aria-pressed",
            String(!showing)
          );
        }
      );
    });

  /*
   * LOGIN
   */

  const loginForm =
    $("#loginForm");

  if (loginForm) {
    const remembered =
      localStorage.getItem(
        "skarRememberedEmail"
      );

    if (remembered) {
      $("#loginEmail").value =
        remembered;

      $("#rememberMe").checked =
        true;
    }

    loginForm.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        const email =
          $("#loginEmail");

        const password =
          $("#loginPassword");

        const message =
          $("#loginMessage");

        const validEmail =
          isValidEmail(email);

        const validPassword =
          password.value.length >= 6;

        setError(
          password,
          validPassword
            ? ""
            : "A senha precisa ter pelo menos 6 caracteres."
        );

        if (
          !validEmail ||
          !validPassword
        ) {
          message.textContent =
            "Confira os campos destacados.";

          message.className =
            "form-message error";

          return;
        }

        if (
          $("#rememberMe").checked
        ) {
          localStorage.setItem(
            "skarRememberedEmail",
            email.value.trim()
          );
        } else {
          localStorage.removeItem(
            "skarRememberedEmail"
          );
        }

        if (!window.skarSupabase) {
          message.textContent = "Não foi possível conectar ao banco de dados.";
          message.className = "form-message error";
          return;
        }

        message.textContent = "Entrando…";
        message.className = "form-message";

        const { error } = await window.skarSupabase.auth.signInWithPassword({
          email: email.value.trim(),
          password: password.value
        });

        if (error) {
          message.textContent = "E-mail ou senha incorretos.";
          message.className = "form-message error";
          return;
        }

        message.textContent = "Acesso confirmado. Abrindo seu painel…";
        window.location.href = "dashboard.html";
      }
    );
  }

  /*
   * CADASTRO
   */

  const registerForm =
    $("#registerForm");

  if (registerForm) {
    registerForm.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        const name =
          $("#registerName");

        const email =
          $("#registerEmail");

        const password =
          $("#registerPassword");

        const confirm =
          $("#confirmPassword");

        const terms =
          $("#terms");

        const message =
          $("#registerMessage");

        const validName =
          name.value.trim().length >= 3;

        const validEmail =
          isValidEmail(email);

        const validPassword =
          password.value.length >= 6;

        const validConfirm =
          confirm.value ===
            password.value &&
          confirm.value !== "";

        setError(
          name,
          validName
            ? ""
            : "Digite seu nome completo."
        );

        setError(
          password,
          validPassword
            ? ""
            : "Use pelo menos 6 caracteres."
        );

        setError(
          confirm,
          validConfirm
            ? ""
            : "As senhas precisam ser iguais."
        );

        $("#termsError").textContent =
          terms.checked
            ? ""
            : "Você precisa aceitar os termos.";

        if (
          !validName ||
          !validEmail ||
          !validPassword ||
          !validConfirm ||
          !terms.checked
        ) {
          message.textContent =
            "Confira os campos destacados.";

          message.className =
            "form-message error";

          return;
        }

        if (!window.skarSupabase) {
          message.textContent = "Não foi possível conectar ao banco de dados.";
          message.className = "form-message error";
          return;
        }

        message.textContent = "Criando sua conta…";
        message.className = "form-message";

        const { data, error } = await window.skarSupabase.auth.signUp({
          email: email.value.trim(),
          password: password.value,
          options: {
            data: { full_name: name.value.trim() }
          }
        });

        if (error) {
          message.textContent = error.message.includes("already")
            ? "Este e-mail já possui uma conta."
            : "Não foi possível criar a conta. Tente novamente.";
          message.className = "form-message error";
          return;
        }

        if (data.session) {
          window.location.href = "dashboard.html";
          return;
        }

        message.textContent = "Conta criada! Confira seu e-mail para confirmar o cadastro.";
        message.className = "form-message";
      }
    );
  }

  /*
   * RECUPERAÇÃO DE SENHA
   */

  const recoveryForm =
    $("#recoveryForm");

  if (recoveryForm) {
    recoveryForm.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        const email =
          $("#recoveryEmail");

        const message =
          $("#recoveryMessage");

        if (!isValidEmail(email)) {
          message.textContent =
            "Confira o e-mail informado.";

          message.className =
            "form-message error";

          return;
        }

        if (!window.skarSupabase) {
          message.textContent = "Não foi possível conectar ao banco de dados.";
          message.className = "form-message error";
          return;
        }

        const { error } = await window.skarSupabase.auth.resetPasswordForEmail(
          email.value.trim(),
          { redirectTo: `${window.location.origin}/index.html` }
        );

        if (error) {
          message.textContent = "Não foi possível enviar as instruções. Tente novamente.";
          message.className = "form-message error";
          return;
        }

        message.textContent = `Instruções enviadas para ${email.value.trim()}.`;
        message.className = "form-message";
        recoveryForm.querySelector("button").disabled = true;
      }
    );
  }

  /*
   * LOGIN COM GOOGLE
   */

  const googleButton =
    $("#googleButton");

  googleButton?.addEventListener(
    "click",
    async () => {
      const message =
        $("#loginMessage");

      if (!window.skarSupabase) {
        message.textContent = "Não foi possível conectar ao banco de dados.";
        message.className = "form-message error";
        return;
      }

      const { error } = await window.skarSupabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard.html` }
      });

      if (error) {
        message.textContent = "O login com Google ainda não está disponível.";
        message.className = "form-message error";
      }
    }
  );

  /*
   * FERRAMENTAS DE NAVEGAÇÃO
   */

  function registerWebMcpTools() {
    const context =
      document.modelContext;

    if (!context?.registerTool) {
      return;
    }

    const tools = [
      {
        name: "start_login",

        title: "Iniciar login",

        description:
          "Preenche o formulário de login visível sem enviar os dados.",

        inputSchema: {
          type: "object",

          properties: {
            email: {
              type: "string"
            }
          },

          required: ["email"],

          additionalProperties: false
        },

        annotations: {
          readOnlyHint: false,
          untrustedContentHint: false
        },

        execute(input) {
          if (
            !loginForm ||
            !emailPattern.test(
              input.email || ""
            )
          ) {
            throw new Error(
              "E-mail inválido ou formulário indisponível."
            );
          }

          $("#loginEmail").value =
            input.email;

          return {
            status: "ready",
            page: "login"
          };
        }
      },

      {
        name:
          "start_account_creation",

        title:
          "Iniciar criação de conta",

        description:
          "Abre a página de cadastro para começar uma nova conta.",

        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        },

        annotations: {
          readOnlyHint: false,
          untrustedContentHint: false
        },

        execute() {
          window.location.href =
            "cadastro.html";

          return {
            status: "navigating",
            page: "cadastro"
          };
        }
      },

      {
        name:
          "start_password_recovery",

        title:
          "Iniciar recuperação de senha",

        description:
          "Abre a página de recuperação de senha.",

        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        },

        annotations: {
          readOnlyHint: false,
          untrustedContentHint: false
        },

        execute() {
          window.location.href =
            "recuperar-senha.html";

          return {
            status: "navigating",
            page: "recuperacao"
          };
        }
      }
    ];

    tools.forEach((tool) => {
      try {
        void Promise.resolve(
          context.registerTool(tool)
        ).catch(() => {});
      } catch (_) {}
    });
  }

  registerWebMcpTools();
})();
