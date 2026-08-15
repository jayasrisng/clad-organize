export type CladPhase = "brief" | "planning" | "market" | "complete"

export type CladIngredientId =
  | "basmati-rice"
  | "biryani-spices"
  | "onion"
  | "chicken"
  | "yogurt"
  | "mint"
  | "cilantro"
  | "ghee"

export interface CladIngredientRecord {
  id: CladIngredientId
  displayName: string
  alreadyOwned: boolean
  collected: boolean
}

type CladPlan = {
  title: string
  subtitle: string
  request: string
  ingredients: ReadonlyArray<{
    id: CladIngredientId
    displayName: string
  }>
}

const BIRYANI_INGREDIENTS: ReadonlyArray<{
  id: CladIngredientId
  displayName: string
}> = [
  {id: "basmati-rice", displayName: "Basmati Rice"},
  {id: "biryani-spices", displayName: "Biryani Spices"},
  {id: "onion", displayName: "Onion"},
  {id: "chicken", displayName: "Chicken"},
  {id: "yogurt", displayName: "Yogurt"},
  {id: "mint", displayName: "Mint"},
  {id: "cilantro", displayName: "Cilantro"},
  {id: "ghee", displayName: "Ghee"},
]

const HOST_DINNER_INGREDIENTS: ReadonlyArray<{
  id: CladIngredientId
  displayName: string
}> = [
  {id: "onion", displayName: "Plates"},
  {id: "mint", displayName: "Cutlery"},
  {id: "cilantro", displayName: "Napkins"},
  {id: "yogurt", displayName: "Entrée"},
  {id: "ghee", displayName: "Dessert"},
  {id: "chicken", displayName: "Drinks"},
]

@component
export class CladOrganizeController extends BaseScriptComponent {
  private phase: CladPhase = "planning"
  private ingredients: CladIngredientRecord[] = []
  private stateListeners: Array<() => void> = []
  private planTitle = ""
  private planSubtitle = ""
  private organizerRequest = ""
  private promptStatus = "Type or say what you want to organize."
  private asrModule: any = require("LensStudio:AsrModule")

  onAwake(): void {
    this.reset()
  }

  public getCurrentPhase(): CladPhase {
    return this.phase
  }

  public getIngredients(): ReadonlyArray<CladIngredientRecord> {
    return this.ingredients
  }

  public getPlanTitle(): string {
    return this.planTitle
  }

  public getPlanSubtitle(): string {
    return this.planSubtitle
  }

  public getOrganizerRequest(): string {
    return this.organizerRequest
  }

  public getPromptStatus(): string {
    return this.promptStatus
  }

  public getIngredient(id: CladIngredientId): CladIngredientRecord | null {
    return this.ingredients.find((ingredient) => ingredient.id === id) ?? null
  }

  public getReadyCount(): number {
    return this.ingredients.filter((ingredient) => this.isReady(ingredient)).length
  }

  public getTotalCount(): number {
    return this.ingredients.length
  }

  public getRemainingCount(): number {
    return this.ingredients.length - this.getReadyCount()
  }

  public openTextPlanner(): void {
    require("LensStudio:TextInputModule")
    const options = new TextInputSystem.KeyboardOptions()
    options.enablePreview = true
    options.keyboardType = TextInputSystem.KeyboardType.Text
    options.returnKeyType = TextInputSystem.ReturnKeyType.Done
    options.initialText = this.organizerRequest
    options.onTextChanged = (text: string) => {
      this.organizerRequest = text
    }
    options.onReturnKeyPressed = () => {
      this.submitOrganizerRequest(this.organizerRequest)
      global.textInputSystem.dismissKeyboard()
    }
    options.onError = (_error: number, description: string) => {
      this.promptStatus = `Text input unavailable: ${description}`
      this.notifyStateChanged()
    }

    global.textInputSystem.requestKeyboard(options)
  }

  public startVoicePlanner(): void {
    this.promptStatus = "Listening… tell CLAD what you want to organize."
    this.notifyStateChanged()

    const options = AsrModule.AsrTranscriptionOptions.create()
    options.silenceUntilTerminationMs = 1000
    options.mode = AsrModule.AsrMode.HighAccuracy
    options.onTranscriptionUpdateEvent.add((event: AsrModule.TranscriptionUpdateEvent) => {
      this.organizerRequest = event.text
      if (event.isFinal && event.text.trim().length > 0) {
        this.submitOrganizerRequest(event.text)
        this.asrModule.stopTranscribing()
      } else {
        this.notifyStateChanged()
      }
    })
    options.onTranscriptionErrorEvent.add((_code: AsrModule.AsrStatusCode) => {
      this.promptStatus = "Voice input needs an internet connection. Try typing instead."
      this.notifyStateChanged()
    })
    this.asrModule.startTranscribing(options)
  }

  public submitOrganizerRequest(request: string): void {
    const normalized = request.trim().toLowerCase()
    if (normalized.length === 0) {
      this.promptStatus = "Tell CLAD what you want to organize first."
      this.notifyStateChanged()
      return
    }

    this.organizerRequest = request.trim()
    const plan = this.createPlan(request)
    this.planTitle = plan.title
    this.planSubtitle = plan.subtitle
    this.ingredients = plan.ingredients.map((ingredient) => ({
      ...ingredient,
      alreadyOwned: false,
      collected: false,
    }))
    this.phase = "planning"
    this.notifyStateChanged()
  }

  public toggleAlreadyOwned(id: CladIngredientId): void {
    if (this.phase !== "planning") {
      return
    }

    const ingredient = this.getIngredient(id)
    if (!ingredient || ingredient.collected) {
      return
    }

    ingredient.alreadyOwned = !ingredient.alreadyOwned
    this.updateCompletionPhase()
    this.notifyStateChanged()
  }

  // Reserved for the CLAD Market milestone. Market items will reference these same IDs.
  public markCollected(id: CladIngredientId): void {
    const ingredient = this.getIngredient(id)
    if (!ingredient || ingredient.collected || ingredient.alreadyOwned) {
      return
    }

    ingredient.collected = true
    ingredient.alreadyOwned = false
    this.updateCompletionPhase()
    this.notifyStateChanged()
  }

  public setPhase(phase: CladPhase): void {
    this.phase = phase
    this.notifyStateChanged()
  }

  public enterMarket(): void {
    if (this.phase === "planning") {
      this.setPhase("market")
    }
  }

  public returnToPlanning(): void {
    if (this.phase === "market") {
      this.setPhase("planning")
    }
  }

  public reset(): void {
    this.phase = "brief"
    this.ingredients = []
    this.planTitle = ""
    this.planSubtitle = ""
    this.organizerRequest = ""
    this.promptStatus = "Type or say what you want to organize."
    this.notifyStateChanged()
  }

  public subscribe(listener: () => void): () => void {
    this.stateListeners.push(listener)
    return () => {
      const index = this.stateListeners.indexOf(listener)
      if (index >= 0) {
        this.stateListeners.splice(index, 1)
      }
    }
  }

  public isReady(ingredient: CladIngredientRecord): boolean {
    return ingredient.alreadyOwned || ingredient.collected
  }

  private updateCompletionPhase(): void {
    if (this.getRemainingCount() === 0) {
      this.phase = "complete"
    }
  }

  private createPlan(request: string): CladPlan {
    const normalized = request.toLowerCase()
    if (normalized.includes("biryani")) {
      return {
        title: "Chicken Biryani",
        subtitle: "Dinner for 4 · Ingredient plan",
        request,
        ingredients: BIRYANI_INGREDIENTS,
      }
    }

    if (normalized.includes("host") || normalized.includes("dinner") || normalized.includes("guests")) {
      const partySize = normalized.match(/\b(\d+)\b/)?.[1]
      return {
        title: "Dinner Hosting",
        subtitle: partySize ? `Dinner for ${partySize} · Hosting checklist` : "Hosting checklist",
        request,
        ingredients: HOST_DINNER_INGREDIENTS,
      }
    }

    return {
      title: "Your Organizer",
      subtitle: "A focused starting checklist",
      request,
      ingredients: [
        {id: "onion", displayName: "Define the outcome"},
        {id: "mint", displayName: "Gather essentials"},
        {id: "cilantro", displayName: "Prepare the space"},
        {id: "yogurt", displayName: "Confirm the plan"},
      ],
    }
  }

  private notifyStateChanged(): void {
    this.stateListeners.forEach((listener) => listener())
  }
}
