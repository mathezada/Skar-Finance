// ==============================
// HERO - PATRIMÔNIO
// ==============================

(function () {
  const target = 128450;

  const valueEl = document.getElementById("hero-value");
  const pctEl = document.getElementById("hero-pct");
  const barsWrap = document.getElementById("hero-bars");

  if (!valueEl || !pctEl || !barsWrap) {
    return;
  }

  const heights = [30, 45, 38, 52, 60, 55, 70, 66, 80, 92, 86, 100];

  heights.forEach(() => {
    const barra = document.createElement("div");
    barra.className = "bar";
    barsWrap.appendChild(barra);
  });

  const bars = barsWrap.querySelectorAll(".bar");

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function formatBRL(valor) {
    return "R$ " + Math.round(valor).toLocaleString("pt-BR");
  }

  if (reduceMotion) {
    valueEl.textContent = formatBRL(target);
    pctEl.textContent = "+18,4%";

    bars.forEach((barra, index) => {
      barra.style.height = heights[index] + "%";

      if (index > heights.length - 4) {
        barra.classList.add("up");
      }
    });

    return;
  }

  let inicio = null;
  const duracao = 1400;

  function animarNumero(timestamp) {
    if (!inicio) {
      inicio = timestamp;
    }

    const progresso = Math.min(
      (timestamp - inicio) / duracao,
      1
    );

    const suavizado =
      1 - Math.pow(1 - progresso, 3);

    valueEl.textContent = formatBRL(
      target * suavizado
    );

    pctEl.textContent =
      "+" +
      (18.4 * suavizado)
        .toFixed(1)
        .replace(".", ",") +
      "%";

    if (progresso < 1) {
      requestAnimationFrame(animarNumero);
    }
  }

  requestAnimationFrame(animarNumero);

  setTimeout(() => {
    bars.forEach((barra, index) => {
      setTimeout(() => {
        barra.style.height =
          heights[index] + "%";

        if (index > heights.length - 4) {
          barra.classList.add("up");
        }
      }, index * 45);
    });
  }, 200);
})();


// ==============================
// SIMULADOR
// ==============================

(function () {
  const aporteInicial = 1000;
  const aporteMensal = 300;
  const anos = 10;

  const taxa = document.getElementById("in-taxa");
  const outTaxa = document.getElementById("out-taxa");

  const resInvestido =
    document.getElementById("res-investido");

  const resRendimento =
    document.getElementById("res-rendimento");

  const resTotal =
    document.getElementById("res-total");

  const chart =
    document.getElementById("sim-chart");

  if (
    !taxa ||
    !outTaxa ||
    !resInvestido ||
    !resRendimento ||
    !resTotal ||
    !chart
  ) {
    return;
  }

  function brl(valor) {
    return (
      "R$ " +
      Math.round(valor).toLocaleString("pt-BR")
    );
  }

  function calcularSaldoAnual(taxaAnual) {
    const taxaMensal =
      Math.pow(1 + taxaAnual, 1 / 12) - 1;

    let saldo = aporteInicial;

    let totalInvestido =
      aporteInicial;

    const saldos = [];

    for (
      let mes = 1;
      mes <= anos * 12;
      mes++
    ) {
      saldo =
        saldo * (1 + taxaMensal) +
        aporteMensal;

      totalInvestido +=
        aporteMensal;

      if (mes % 12 === 0) {
        saldos.push(saldo);
      }
    }

    return {
      saldos,
      totalInvestido,
      totalFinal: saldo
    };
  }

  const tetoGrafico =
    calcularSaldoAnual(
      parseFloat(taxa.max) / 100
    ).totalFinal;

  function calcular() {
    const taxaAnual =
      parseFloat(taxa.value) / 100;

    outTaxa.textContent =
      (taxaAnual * 100)
        .toFixed(1)
        .replace(".", ",") + "%";

    const {
      saldos,
      totalInvestido,
      totalFinal
    } = calcularSaldoAnual(
      taxaAnual
    );

    const rendimento =
      totalFinal -
      totalInvestido;

    resInvestido.textContent =
      brl(totalInvestido);

    resRendimento.textContent =
      brl(rendimento);

    resTotal.textContent =
      brl(totalFinal);

    chart.innerHTML = "";

    saldos.forEach((valor) => {
      const barra =
        document.createElement("div");

      barra.className = "bar";

      barra.style.height =
        Math.max(
          (valor / tetoGrafico) * 100,
          3
        ) + "%";

      chart.appendChild(barra);
    });
  }

  taxa.addEventListener(
    "input",
    calcular
  );

  calcular();
})();