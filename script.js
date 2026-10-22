const questionBank = [
	{ word: "glimmer", clue: "A faint, wavering light shines through the trees. What word describes that small, soft shine?", options: ["glimmer", "thunder", "shadow", "whisper"] },
	{ word: "enormous", clue: "A tree is so big that three people holding hands can barely reach around it. It is…", options: ["enormous", "shallow", "gentle", "narrow"] },
	{ word: "curious", clue: "Mina keeps asking questions because she really wants to discover what is inside the cave. She is…", options: ["curious", "sleepy", "careless", "silent"] },
	{ word: "shelter", clue: "Rain is falling hard, so you find a dry place under a rocky ledge. This safe place is a…", options: ["shelter", "summit", "stream", "signal"] },
	{ word: "ancient", clue: "The stone bridge has stood here for thousands of years. It is very…", options: ["ancient", "recent", "fragile", "ordinary"] },
	{ word: "wander", clue: "With no particular route, you stroll slowly along the winding forest path. You…", options: ["wander", "hurry", "freeze", "gather"] },
	{ word: "brilliant", clue: "You solve the tricky map puzzle in a clever, impressive way. That was…", options: ["brilliant", "muddy", "distant", "silent"] },
	{ word: "destination", clue: "After a long walk, you finally reach the place you were traveling toward. That place is your…", options: ["destination", "direction", "departure", "distance"] }
];

const trailStops = ["⌂", "1", "2", "3", "4", "5", "6", "7", "8", "★"];
const welcomeScreen = document.getElementById("welcome-screen");
const gameShell = document.getElementById("game-shell");
const startButton = document.getElementById("start-button");
const soundToggle = document.getElementById("sound-toggle");
const soundIcon = document.getElementById("sound-icon");
const soundLabel = document.getElementById("sound-label");
const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");
const questionCountElement = document.getElementById("question-count");
const questionTitleElement = document.getElementById("question-title");
const clueElement = document.getElementById("clue");
const answersElement = document.getElementById("answers");
const feedbackElement = document.getElementById("feedback");
const nextButton = document.getElementById("next-button");
const playAgainButton = document.getElementById("play-again");
const trailMap = document.getElementById("trail-map");
const trailCaption = document.getElementById("trail-caption");

let questions = [];
let questionIndex = 0;
let score = 0;
let lives = 3;
let answered = false;
let soundEnabled = true;
let audioContext;

function shuffle(items) {
	const shuffled = [...items];
	for (let index = shuffled.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
	}
	return shuffled;
}

function playSound(kind) {
	if (!soundEnabled) return;
	const AudioContextType = window.AudioContext || window.webkitAudioContext;
	if (!AudioContextType) return;
	audioContext ??= new AudioContextType();
	if (audioContext.state === "suspended") audioContext.resume();
	const notes = {
		click: [{ frequency: 540, duration: 0.055, wave: "sine" }],
		correct: [{ frequency: 660, duration: 0.11, wave: "sine" }, { frequency: 880, duration: 0.16, wave: "sine", delay: 0.09 }],
		wrong: [{ frequency: 240, duration: 0.12, wave: "triangle" }, { frequency: 190, duration: 0.14, wave: "triangle", delay: 0.1 }],
		win: [{ frequency: 523, duration: 0.13, wave: "sine" }, { frequency: 659, duration: 0.13, wave: "sine", delay: 0.12 }, { frequency: 784, duration: 0.23, wave: "sine", delay: 0.24 }]
	};
	const now = audioContext.currentTime;
	for (const note of notes[kind]) {
		const oscillator = audioContext.createOscillator();
		const volume = audioContext.createGain();
		const startAt = now + (note.delay || 0);
		oscillator.type = note.wave;
		oscillator.frequency.value = note.frequency;
		volume.gain.setValueAtTime(0.0001, startAt);
		volume.gain.exponentialRampToValueAtTime(0.13, startAt + 0.02);
		volume.gain.exponentialRampToValueAtTime(0.0001, startAt + note.duration);
		oscillator.connect(volume);
		volume.connect(audioContext.destination);
		oscillator.start(startAt);
		oscillator.stop(startAt + note.duration + 0.02);
	}
}

function renderTrail() {
	trailMap.querySelectorAll(".trail-stop").forEach((stop) => stop.remove());
	trailStops.forEach((label, index) => {
		const stop = document.createElement("span");
		stop.className = "trail-stop";
		stop.textContent = label;
		if (index < questionIndex + 1) stop.classList.add("done");
		if (index === questionIndex + 1 && questionIndex < questionBank.length) stop.classList.add("current");
		if (index === trailStops.length - 1) stop.classList.add("finish");
		trailMap.append(stop);
	});
	const progress = Math.min(questionIndex + 1, questionBank.length);
	trailMap.setAttribute("aria-label", `Trail progress: ${progress} of ${questionBank.length} clues`);
	trailCaption.textContent = questionIndex === 0 ? "The forest entrance" : `Past ${questionIndex} ${questionIndex === 1 ? "marker" : "markers"}`;
}

function showQuestion() {
	const question = questions[questionIndex];
	answered = false;
	questionCountElement.textContent = `Trail clue ${questionIndex + 1} of ${questions.length}`;
	questionTitleElement.textContent = "Find the right word!";
	clueElement.textContent = question.clue;
	feedbackElement.textContent = "Pick the word that best matches the clue.";
	feedbackElement.className = "feedback";
	nextButton.hidden = true;
	playAgainButton.hidden = true;
	answersElement.replaceChildren();
	shuffle(question.options).forEach((option, index) => {
		const button = document.createElement("button");
		button.className = "answer";
		button.type = "button";
		button.setAttribute("aria-label", `${index + 1}: ${option}`);
		button.innerHTML = `<span class="answer-key" aria-hidden="true">${index + 1}</span><span class="answer-text"></span>`;
		button.querySelector(".answer-text").textContent = option;
		button.addEventListener("click", () => chooseAnswer(button, option));
		answersElement.append(button);
	});
	renderTrail();
}

function chooseAnswer(button, choice) {
	if (answered) return;
	playSound("click");
	const question = questions[questionIndex];
	if (choice === question.word) {
		answered = true;
		score += 10;
		scoreElement.textContent = score;
		button.classList.add("correct");
		answersElement.querySelectorAll(".answer").forEach((answer) => { answer.disabled = true; });
		feedbackElement.textContent = `You got it! “${question.word}” is just right!`;
		feedbackElement.className = "feedback good";
		nextButton.hidden = false;
		playSound("correct");
		nextButton.focus();
	} else {
		lives -= 1;
		livesElement.textContent = lives;
		button.classList.add("incorrect");
		button.disabled = true;
		feedbackElement.textContent = lives > 0 ? "Oops! Try another word. One heart used." : `Out of hearts! The word was “${question.word}.”`;
		feedbackElement.className = "feedback bad";
		playSound("wrong");
		if (lives === 0) finishGame(false);
	}
}

function finishGame(won) {
	answered = true;
	answersElement.querySelectorAll(".answer").forEach((answer) => { answer.disabled = true; });
	nextButton.hidden = true;
	questionCountElement.textContent = won ? "Trail complete!" : "Adventure pause";
	questionTitleElement.textContent = won ? "You found your way!" : "The trail can wait.";
	clueElement.textContent = won
		? "You made it through the forest and collected a whole pocketful of new words. What a wonderful explorer!"
		: "Every explorer needs a rest. Take another walk and see how far you get next time.";
	feedbackElement.textContent = `Final score: ${score} points!`;
	feedbackElement.className = won ? "feedback good" : "feedback bad";
	playAgainButton.hidden = false;
	trailCaption.textContent = won ? "You reached the lookout!" : "A cozy place to rest";
	if (won) {
		playSound("win");
		questionIndex = questionBank.length;
		renderTrail();
	}
	playAgainButton.focus();
}

function startGame() {
	playSound("click");
	questions = shuffle(questionBank);
	questionIndex = 0;
	score = 0;
	lives = 3;
	scoreElement.textContent = score;
	livesElement.textContent = lives;
	welcomeScreen.hidden = true;
	gameShell.hidden = false;
	showQuestion();
	answersElement.querySelector(".answer")?.focus();
}

startButton.addEventListener("click", startGame);
playAgainButton.addEventListener("click", startGame);
nextButton.addEventListener("click", () => {
	playSound("click");
	questionIndex += 1;
	if (questionIndex === questions.length) finishGame(true);
	else {
		showQuestion();
		answersElement.querySelector(".answer")?.focus();
	}
});

soundToggle.addEventListener("click", () => {
	soundEnabled = !soundEnabled;
	soundToggle.setAttribute("aria-pressed", String(!soundEnabled));
	soundToggle.setAttribute("aria-label", soundEnabled ? "Mute sound" : "Turn sound on");
	soundIcon.textContent = soundEnabled ? "🔊" : "🔇";
	soundLabel.textContent = soundEnabled ? "Sound on" : "Sound off";
	if (soundEnabled) playSound("click");
});

document.addEventListener("keydown", (event) => {
	if (event.altKey || event.ctrlKey || event.metaKey || gameShell.hidden) return;
	if (/^[1-4]$/.test(event.key)) answersElement.querySelectorAll(".answer")[Number(event.key) - 1]?.click();
});