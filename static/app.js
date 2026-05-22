const substanceLibrary = [
  { name: "CuSO4", label: "Меден сулфат", color: "#32a9df", state: "воден разтвор" },
  { name: "NaOH", label: "Натриева основа", color: "#d8f2ff", state: "воден разтвор" },
  { name: "CH3COOH", label: "Оцетна киселина", color: "#fff2bc", state: "разтвор" },
  { name: "NaHCO3", label: "Сода бикарбонат", color: "#ffffff", state: "прах" },
  { name: "AgNO3", label: "Сребърен нитрат", color: "#eff6ff", state: "разтвор" },
  { name: "NaCl", label: "Натриев хлорид", color: "#f8fbff", state: "разтвор" },
  { name: "Fe", label: "Желязо", color: "#9ca3af", state: "метал" },
  { name: "C20H14O4", label: "Фенолфталеин", color: "#ffffff", state: "индикатор" },
  { name: "HCl", label: "Солна киселина", color: "#e8f8ff", state: "разтвор" },
  { name: "H2O2", label: "Водороден пероксид", color: "#edfaff", state: "разтвор" },
  { name: "KI", label: "Калиев йодид", color: "#fff8df", state: "разтвор" },
  { name: "I2", label: "Йод", color: "#8b5a2b", state: "разтвор" },
];

const state = {
  reactions: [],
  selected: null,
  customReagents: [],
  running: false,
  step: 0,
};

const list = document.querySelector("#reactionList");
const title = document.querySelector("#reactionTitle");
const reagentTubes = document.querySelector("#reagentTubes");
const productTubes = document.querySelector("#productTubes");
const mixLiquid = document.querySelector("#mixLiquid");
const particleField = document.querySelector("#particleField");
const labStage = document.querySelector(".lab-stage");
const difficultyDots = document.querySelector("#difficultyDots");
const observation = document.querySelector("#observation");
const equation = document.querySelector("#equation");
const explanation = document.querySelector("#explanation");
const safety = document.querySelector("#safety");
const quizQuestion = document.querySelector("#quizQuestion");
const quizAnswers = document.querySelector("#quizAnswers");
const quizResult = document.querySelector("#quizResult");
const startButton = document.querySelector("#startReaction");
const resetButton = document.querySelector("#resetReaction");
const randomButton = document.querySelector("#randomReaction");
const steps = [...document.querySelectorAll(".step")];
const conceptDialog = document.querySelector("#conceptDialog");
const showConcept = document.querySelector("#showConcept");
const substanceSelect = document.querySelector("#substanceSelect");
const addSubstance = document.querySelector("#addSubstance");
const selectedReagents = document.querySelector("#selectedReagents");
const mixCustom = document.querySelector("#mixCustom");
const clearCustom = document.querySelector("#clearCustom");
const builderStatus = document.querySelector("#builderStatus");

function cssColor(color) {
  return color || "#d8f2ff";
}

function keyFor(items) {
  return items.map((item) => item.name).sort().join("+");
}

function cloneReaction(reaction) {
  return JSON.parse(JSON.stringify(reaction));
}

function averageColor(items) {
  const colors = items.map((item) => cssColor(item.color).replace("#", ""));
  const totals = colors.reduce(
    (acc, color) => {
      acc.r += Number.parseInt(color.slice(0, 2), 16);
      acc.g += Number.parseInt(color.slice(2, 4), 16);
      acc.b += Number.parseInt(color.slice(4, 6), 16);
      return acc;
    },
    { r: 0, g: 0, b: 0 },
  );
  const toHex = (value) => Math.round(value / colors.length).toString(16).padStart(2, "0");
  return `#${toHex(totals.r)}${toHex(totals.g)}${toHex(totals.b)}`;
}

function knownReactionFromCustom() {
  const customKey = keyFor(state.customReagents);
  const match = state.reactions.find((reaction) => keyFor(reaction.reagents) === customKey);
  if (!match) return null;

  const customReaction = cloneReaction(match);
  customReaction.id = `custom-${match.id}`;
  customReaction.title = `Потребителски опит: ${state.customReagents.map((item) => item.name).join(" + ")}`;
  return customReaction;
}

function unknownCustomReaction() {
  const mixColor = averageColor(state.customReagents);
  const formulas = state.customReagents.map((item) => item.name).join(" + ");
  return {
    id: "custom-unknown",
    title: `Потребителски опит: ${formulas}`,
    level: "изследване",
    type: "Неразпозната комбинация",
    energy: "Няма заложен модел за тази смес",
    difficulty: 1,
    reagents: state.customReagents.map((item) => ({ ...item })),
    products: [
      {
        name: "смес",
        label: "Смес",
        color: mixColor,
        state: "няма разпознат продукт",
      },
    ],
    equation: `${formulas} -> няма разпозната реакция в симулатора`,
    observation:
      "В тази версия няма сигурен модел за избраната комбинация. Това е добър момент да провериш в учебника или с учител.",
    explanation:
      "Симулаторът разпознава само въведените учебни реакции. При неизвестна комбинация показва смесване, без да измисля продукти.",
    safety:
      "Непознати вещества не се смесват в истинска лаборатория без указания от учител.",
    particles: "color",
    quiz: {
      question: "Какво е правилното действие при непозната комбинация?",
      answers: ["Да проверим с учител", "Да опитаме на вкус", "Да загреем силно"],
      correct: 0,
    },
  };
}

function renderSubstanceOptions() {
  substanceSelect.innerHTML = substanceLibrary
    .map((item) => `<option value="${item.name}">${item.name} - ${item.label}</option>`)
    .join("");
}

function renderSelectedReagents() {
  if (state.customReagents.length === 0) {
    selectedReagents.innerHTML = `<p class="empty-selection">Няма добавени вещества.</p>`;
  } else {
    selectedReagents.innerHTML = state.customReagents
      .map(
        (item) => `
          <button class="reagent-chip" type="button" data-remove="${item.name}">
            <span style="--chip-color:${cssColor(item.color)}"></span>
            ${item.name}
            <small>${item.label}</small>
          </button>
        `,
      )
      .join("");
  }

  mixCustom.disabled = state.customReagents.length < 2;
  builderStatus.textContent =
    state.customReagents.length < 2
      ? "Добави поне две вещества, за да стартираш свой опит."
      : "Готово за смесване.";
}

function renderReactionList() {
  list.innerHTML = state.reactions
    .map((reaction) => {
      const active = reaction.id === state.selected?.id ? "active" : "";
      return `
        <button class="reaction-card ${active}" type="button" data-id="${reaction.id}">
          <strong>${reaction.title}</strong>
          <span class="reaction-meta">
            <span>${reaction.level}</span>
            <span>${reaction.type}</span>
          </span>
        </button>
      `;
    })
    .join("");
}

function tubeTemplate(item, index, hidden = false) {
  const height = hidden ? 0 : 42 + Math.min(index * 7, 14);
  const opacity = hidden ? 0.18 : 1;
  return `
    <div class="tube-wrap" style="opacity:${opacity}">
      <div class="test-tube" aria-hidden="true">
        <div class="liquid" style="--liquid-color:${cssColor(item.color)}; height:${height}%"></div>
      </div>
      <div class="tube-label">${item.name}<span>${item.state}</span></div>
    </div>
  `;
}

function renderTubes() {
  reagentTubes.innerHTML = state.selected.reagents
    .map((item, index) => tubeTemplate(item, index))
    .join("");

  productTubes.innerHTML = state.selected.products
    .map((item, index) => tubeTemplate(item, index, !state.running && state.step < 2))
    .join("");
}

function renderDifficulty() {
  difficultyDots.innerHTML = Array.from({ length: 3 })
    .map((_, index) => `<i class="${index < state.selected.difficulty ? "on" : ""}"></i>`)
    .join("");
}

function renderInfo() {
  title.textContent = state.selected.title;
  observation.textContent = state.running || state.step === 2
    ? state.selected.observation
    : "Реагентите са подготвени. Стартирай, за да видиш видимите признаци на реакцията.";
  equation.textContent = state.selected.equation;
  explanation.textContent = state.step === 2
    ? state.selected.explanation
    : `${state.selected.type}. ${state.selected.energy}.`;
  safety.textContent = state.selected.safety;
  quizQuestion.textContent = state.selected.quiz.question;
  quizResult.textContent = "";
  quizAnswers.innerHTML = state.selected.quiz.answers
    .map((answer, index) => `<button class="answer" type="button" data-answer="${index}">${answer}</button>`)
    .join("");
}

function blendProductColor() {
  const product = state.selected.products[0];
  return cssColor(product.color);
}

function renderParticles() {
  particleField.innerHTML = "";
  if (!state.running) return;

  const count = state.selected.particles === "color" ? 9 : 18;
  const color = state.selected.products[0]?.color || "#ffffff";

  for (let i = 0; i < count; i += 1) {
    const particle = document.createElement("span");
    particle.className = `particle ${state.selected.particles}`;
    particle.style.setProperty("--x", `${18 + Math.random() * 66}%`);
    particle.style.setProperty("--particle-color", color);
    particle.style.animationDelay = `${Math.random() * 900}ms`;
    particle.style.animationDuration = `${900 + Math.random() * 900}ms`;
    particleField.appendChild(particle);
  }
}

function setStep(step) {
  state.step = step;
  steps.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.step) === step);
  });

  if (step === 0) {
    state.running = false;
    labStage.classList.remove("running");
    mixLiquid.style.height = "34%";
    mixLiquid.style.setProperty("--liquid-color", state.selected.reagents[0].color);
  }

  if (step === 1) {
    state.running = true;
    labStage.classList.add("running");
    mixLiquid.style.height = "58%";
    mixLiquid.style.setProperty("--liquid-color", blendProductColor());
  }

  if (step === 2) {
    state.running = true;
    labStage.classList.add("running");
    mixLiquid.style.height = "66%";
    mixLiquid.style.setProperty("--liquid-color", blendProductColor());
  }

  renderTubes();
  renderInfo();
  renderParticles();
}

function selectReaction(id) {
  state.selected = cloneReaction(state.reactions.find((reaction) => reaction.id === id) || state.reactions[0]);
  state.running = false;
  state.step = 0;
  renderReactionList();
  renderDifficulty();
  renderTubes();
  renderInfo();
  setStep(0);
}

function selectCustomReaction() {
  if (state.customReagents.length < 2) return;

  state.selected = knownReactionFromCustom() || unknownCustomReaction();
  state.running = false;
  state.step = 0;
  renderReactionList();
  renderDifficulty();
  renderTubes();
  renderInfo();
  setStep(0);
  startReaction();
}

function addCustomSubstance() {
  const substance = substanceLibrary.find((item) => item.name === substanceSelect.value);
  if (!substance) return;

  const alreadyAdded = state.customReagents.some((item) => item.name === substance.name);
  if (alreadyAdded) {
    builderStatus.textContent = "Това вещество вече е добавено.";
    return;
  }

  if (state.customReagents.length >= 4) {
    builderStatus.textContent = "За ясен опит използвай до четири вещества.";
    return;
  }

  state.customReagents.push({ ...substance });
  renderSelectedReagents();
}

function startReaction() {
  setStep(1);
  window.setTimeout(() => {
    if (state.running) setStep(2);
  }, 1500);
}

function resetReaction() {
  setStep(0);
}

async function boot() {
  renderSubstanceOptions();
  renderSelectedReagents();
  const response = await fetch("/reactions.json");
  if (!response.ok) {
    throw new Error("Не могат да се заредят реакциите.");
  }
  state.reactions = await response.json();
  selectReaction(state.reactions[0].id);
}

list.addEventListener("click", (event) => {
  const card = event.target.closest("[data-id]");
  if (card) selectReaction(card.dataset.id);
});

addSubstance.addEventListener("click", addCustomSubstance);

selectedReagents.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-remove]");
  if (!chip) return;

  state.customReagents = state.customReagents.filter((item) => item.name !== chip.dataset.remove);
  renderSelectedReagents();
});

mixCustom.addEventListener("click", selectCustomReaction);

clearCustom.addEventListener("click", () => {
  state.customReagents = [];
  renderSelectedReagents();
});

startButton.addEventListener("click", startReaction);
resetButton.addEventListener("click", resetReaction);

randomButton.addEventListener("click", () => {
  const next = state.reactions[Math.floor(Math.random() * state.reactions.length)];
  selectReaction(next.id);
  startReaction();
});

steps.forEach((button) => {
  button.addEventListener("click", () => setStep(Number(button.dataset.step)));
});

quizAnswers.addEventListener("click", (event) => {
  const answer = event.target.closest("[data-answer]");
  if (!answer) return;

  const chosen = Number(answer.dataset.answer);
  const correct = state.selected.quiz.correct;
  [...quizAnswers.querySelectorAll(".answer")].forEach((button, index) => {
    button.classList.toggle("correct", index === correct);
    button.classList.toggle("wrong", index === chosen && chosen !== correct);
  });
  quizResult.textContent = chosen === correct ? "Точно така." : "Почти. Виж уравнението и опитай пак.";
});

showConcept.addEventListener("click", () => {
  if (typeof conceptDialog.showModal === "function") {
    conceptDialog.showModal();
  }
});

boot();
