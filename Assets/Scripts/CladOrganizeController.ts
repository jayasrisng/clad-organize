export type CladPhase = "planning" | "market" | "complete"

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

const INGREDIENT_DEFINITIONS: ReadonlyArray<{
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

@component
export class CladOrganizeController extends BaseScriptComponent {
  private phase: CladPhase = "planning"
  private ingredients: CladIngredientRecord[] = []
  private stateListeners: Array<() => void> = []

  onAwake(): void {
    this.reset()
  }

  public getCurrentPhase(): CladPhase {
    return this.phase
  }

  public getIngredients(): ReadonlyArray<CladIngredientRecord> {
    return this.ingredients
  }

  public getIngredient(id: CladIngredientId): CladIngredientRecord | null {
    return this.ingredients.find((ingredient) => ingredient.id === id) ?? null
  }

  public getReadyCount(): number {
    return this.ingredients.filter((ingredient) => this.isReady(ingredient)).length
  }

  public getRemainingCount(): number {
    return this.ingredients.length - this.getReadyCount()
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
    this.phase = "planning"
    this.ingredients = INGREDIENT_DEFINITIONS.map((definition) => ({
      id: definition.id,
      displayName: definition.displayName,
      alreadyOwned: false,
      collected: false,
    }))
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

  private notifyStateChanged(): void {
    this.stateListeners.forEach((listener) => listener())
  }
}
