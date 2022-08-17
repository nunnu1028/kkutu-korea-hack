namespace WordUtils {
	export async function loadWordList(): Promise<string[]> {
		const response = await fetch("https://raw.githubusercontent.com/nunnu1028/kkutu-korea-hack/stable/data.json");
		const text = await response.text();
		return JSON.parse(text);
	}

	export function getWords(wordList: string[], usedWords: string[], firstWord: string): string[] {
		const startWord = firstWord.includes("(") ? firstWord.replace(")", "").split("(") : [firstWord];
		const words = wordList.filter((word) => !usedWords.includes(word) && word.startsWith(startWord[0]) && word.length > 1);

		return words;
	}
}

interface KkutuHackOption {
	sortFunction: (a: string, b: string) => number;
	sortByLength: boolean;
	sortByEndWord: boolean;
	endWord: string[];
	inputInsteadLog: boolean;
	typingSpeed?: number;
}

const DefaultOption: KkutuHackOption = {
	sortFunction: (a: string, b: string) => a.length - b.length,
	sortByLength: true,
	sortByEndWord: true,
	endWord: [""],
	inputInsteadLog: false,
	typingSpeed: 1000
};

class KkutuHack {
	private _wordList: string[] = [];
	private _usedWords: string[] = [];
	private _inited: boolean = false;
	private _observer: MutationObserver | null = null;
	private _task: NodeJS.Timer | null = null;
	private _running: boolean = false;

	constructor(private _option: KkutuHackOption = DefaultOption) {}

	public get option(): KkutuHackOption {
		return this._option;
	}

	public set option(value: KkutuHackOption) {
		this._option = value;
	}

	public getInputDoc(): HTMLInputElement {
		return Array.from(document.getElementsByClassName("ChatBox Product")[0].getElementsByTagName("input"))
			.slice(1)
			.filter((e) => (e.attributes as unknown as { style: { textContent: string } }).style.textContent.length > 50)[0];
	}

	public getWords(firstWord: string): string[] {
		if (!this._inited) throw new Error("Not initialized");

		const words = WordUtils.getWords(this._wordList, this._usedWords, firstWord);

		if (this._option.sortByLength) {
			if (this._option.sortByEndWord) {
				const endWords = words.filter((word) => this._option.endWord.some((endWord) => word.endsWith(endWord)));
				const nonEndWords = words.filter((word) => !this._option.endWord.some((endWord) => word.endsWith(endWord)));

				return nonEndWords.sort(this._option.sortFunction).concat(endWords.sort(this._option.sortFunction));
			}

			return words.sort(this._option.sortFunction);
		}

		return words;
	}

	public updateUsedWords(): void {
		const chain = parseInt((document.getElementsByClassName("chain")[0] as unknown as { innerText: string }).innerText);

		if (chain < 1) this._usedWords = [];
		const historyItems = Array.from(document.getElementsByClassName("ellipse history-item expl-mother")).map((e) => e.innerHTML.split("<")[0]);
		if (historyItems[0] && !this._usedWords.includes(historyItems[0])) this._usedWords.push(historyItems[0]);
	}

	public getStartWord(): string {
		return (document.getElementsByClassName("jjo-display ellipse")[0] as unknown as { innerText: string }).innerText;
	}

	public async init(): Promise<void> {
		this._wordList = await WordUtils.loadWordList();
		eval(await (await fetch("https://unpkg.com/hangul-js")).text());
		this._observer = new MutationObserver(async (mutations) => {
			mutations.forEach(async (mutation) => {
				if ((mutation.target as unknown as { style: { display: string } }).style.display === "block") {
					const startWord = this.getStartWord();
					const wordList = this.getWords(startWord);
					const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

					if (this._option.inputInsteadLog && this._option.typingSpeed) {
						// @ts-ignore
						const time = (Hangul.disassemble(wordList[wordList.length - 1]).length / Math.floor(this._option.typingSpeed / 60)) * 1000;
						await sleep(time);

						this.getInputDoc().value = wordList[wordList.length - 1];
					} else {
						for (let i = 0; i < wordList.length / 2000; i++) {
							const words = wordList.slice(i * 2000, (i + 1) * 2000);
							console.log(words.join("\n"));
						}
					}
				}
			});
		});
		this._inited = true;
	}

	public run(): void {
		if (!this._inited) throw new Error("Not initialized");
		if (this._running) this.stop();

		const target = document.getElementsByClassName("GameBox Product")[0].getElementsByClassName("game-input")[0];
		this._observer!.observe(target, { attributes: true, attributeFilter: ["style"] });
		this._task = setInterval(this.updateUsedWords, 1000);

		this._running = true;
	}

	public stop(): void {
		if (!this._inited) throw new Error("Not initialized");
		if (!this._running) throw new Error("Not running");

		this._observer!.disconnect();
		clearInterval(this._task!);
		this._task = null;

		this._running = false;
	}
}

const hack = new KkutuHack({ ...DefaultOption, endWord: ["윰", "릇", "늣", "륨"] });

hack.init().then(() => {
	hack.run();
	console.log("[+] KKUTU HACK RUNNING");
});
