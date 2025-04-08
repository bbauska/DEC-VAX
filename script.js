document.addEventListener("DOMContentLoaded", () => {
	// DOM Elements
	const terminalInput = document.getElementById("terminal-input");
	const output = document.getElementById("output");
	const fileInput = document.getElementById("file-input");
	const modal = document.getElementById("modal");
	const previewContainer = document.getElementById("preview-container");

	// Audio elements
	const keypressSound = document.getElementById("keypress-sound");
	const accessSound = document.getElementById("access-sound");
	const errorSound = document.getElementById("error-sound");
	const decryptSound = document.getElementById("decrypt-sound");

	// Terminal state
	const state = {
		date: null,
		color: "#00ff00",
		file: null,
		isProcessing: false
	};

	// Initialize Matrix rain
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	document.getElementById("matrix-canvas").appendChild(canvas);

	const matrix = {
		chars:
			"01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン",
		drops: Array(Math.floor(canvas.width / 20))
			.fill(0)
			.map(() => Math.random() * -canvas.height),

		draw() {
			ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.fillStyle = "#0f0";
			ctx.font = "15px monospace";

			this.drops.forEach((drop, i) => {
				const char = this.chars[Math.floor(Math.random() * this.chars.length)];
				ctx.fillText(char, i * 20, drop * 20);

				if (drop * 20 > canvas.height && Math.random() > 0.975) {
					this.drops[i] = 0;
				} else {
					this.drops[i]++;
				}
			});

			requestAnimationFrame(() => this.draw());
		}
	};

	matrix.draw();

	// Sound effects
	const playSound = (type) => {
		const sounds = {
			keypress: keypressSound,
			access: accessSound,
			error: errorSound,
			decrypt: decryptSound
		};

		if (sounds[type]) {
			sounds[type].volume = 0.3;
			sounds[type].currentTime = 0;
			sounds[type].play().catch(() => {});
		}
	};

	// Add text to terminal
	const addToTerminal = (text, className = "") => {
		const p = document.createElement("p");
		p.className = className;
		p.textContent = text;
		output.appendChild(p);
		output.scrollTop = output.scrollHeight;
	};

	// Show error message
	const showError = (message) => {
		playSound("error");
		addToTerminal(message, "error-message");
	};

	// Process date picker command
	const handleDatePicker = () => {
		const dateInput = document.createElement("input");
		dateInput.type = "date";
		dateInput.className = "picker date-picker";
		output.appendChild(dateInput);

		dateInput.addEventListener("change", () => {
			state.date = dateInput.value;
			playSound("access");
			addToTerminal(`Date set to: ${state.date}`, "success-message");
			dateInput.remove();
		});

		dateInput.click();
	};

	// Process color picker command
	const handleColorPicker = () => {
		const colorInput = document.createElement("input");
		colorInput.type = "color";
		colorInput.value = state.color;
		colorInput.className = "picker color-picker";
		output.appendChild(colorInput);

		colorInput.addEventListener("change", () => {
			state.color = colorInput.value;
			document.documentElement.style.setProperty("--primary", state.color);
			document.documentElement.style.setProperty("--text", state.color);
			playSound("access");
			addToTerminal(`Color set to: ${state.color}`, "success-message");

			const preview = document.createElement("div");
			preview.className = "color-preview";
			preview.style.backgroundColor = state.color;
			output.appendChild(preview);

			colorInput.remove();
		});

		colorInput.click();
	};

	// Process file picker command
	const handleFilePicker = () => {
		fileInput.click();
		return new Promise((resolve) => {
			fileInput.onchange = async () => {
				if (fileInput.files.length === 0) {
					await addToTerminal("File upload cancelled", "error-message");
					resolve();
					return;
				}

				const file = fileInput.files[0];
				state.file = file;

				const preview = document.createElement("div");
				preview.className = "file-preview";
				output.appendChild(preview);

				await addToTerminal(
					`Name: ${file.name}\nSize: ${Math.round(file.size / 1024)}KB\nType: ${
						file.type || "Unknown"
					}`,
					""
				);

				if (file.type.startsWith("image/")) {
					const img = document.createElement("img");
					img.src = URL.createObjectURL(file);
					img.className = "preview-image";
					preview.appendChild(img);
				}

				playSound("access");
				resolve();
			};
		});
	};

	// Available commands
	const commands = {
		help: () => {
			addToTerminal("Available commands:", "help-header");
			addToTerminal("/date - Open date picker", "command-help");
			addToTerminal("/color - Open color picker", "command-help");
			addToTerminal("/file - Open file picker", "command-help");
			addToTerminal("/clear - Clear terminal", "command-help");
			addToTerminal("/status - Show current selections", "command-help");
		},

		date: handleDatePicker,
		color: handleColorPicker,
		file: handleFilePicker,

		clear: () => {
			output.innerHTML = "";
			addToTerminal("Terminal cleared. Type /help for commands.", "command-help");
		},

		status: () => {
			addToTerminal("=== CURRENT SELECTIONS ===", "status-header");
			addToTerminal(`Date: ${state.date || "Not set"}`, "status-item");
			addToTerminal(`Color: ${state.color}`, "status-item");
			addToTerminal(
				`File: ${state.file ? state.file.name : "Not selected"}`,
				"status-item"
			);
		}
	};

	// Command processor
	const processCommand = (input) => {
		if (state.isProcessing) return;
		state.isProcessing = true;

		const command = input.toLowerCase().trim();
		if (!command) return;

		addToTerminal(`> ${input}`, "command-input");

		if (command.startsWith("/")) {
			const cmd = command.slice(1);
			if (commands[cmd]) {
				commands[cmd]();
			} else {
				showError(`Unknown command: ${command}`);
			}
		} else {
			showError("Commands must start with /");
		}
		state.isProcessing = false;
		terminalInput.focus();
	};

	// Event listeners
	terminalInput.addEventListener("keydown", (e) => {
		if (e.key === "Enter" && !state.isProcessing) {
			const command = terminalInput.value.trim();
			if (command) {
				processCommand(command);
				terminalInput.value = "";
			}
		} else {
			playSound("keypress");
		}
	});

	// Initialize
	addToTerminal("DEC Vax VMS TERMINAL v2.25.2", "header");
	addToTerminal("Type /help for available commands", "command-help");
	terminalInput.focus();
	window.addEventListener("click", () => {
		if (!state.isProcessing) terminalInput.focus();
	});
});
