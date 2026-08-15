import {CladIngredientId, CladOrganizeController} from "./CladOrganizeController"
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {InteractorEvent} from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent"

@component
export class CladMarketItemInteraction extends BaseScriptComponent {
  @input
  controller!: CladOrganizeController

  @input
  ingredientId: string = "onion"

  private interactable: Interactable | null = null
  private collected = false
  private unsubscribe: (() => void) | null = null

  onAwake(): void {
    this.ensureCollider()
    this.ensureInteractable()

    this.createEvent("OnStartEvent").bind(() => {
      if (!this.controller || !this.interactable) {
        print("CLAD Market Item: controller input is required.")
        return
      }
      this.interactable.onTriggerStart.add((event: InteractorEvent) => this.collect(event))
      this.unsubscribe = this.controller.subscribe(() => this.syncVisibility())
      this.syncVisibility()
    })

    this.createEvent("OnDestroyEvent").bind(() => this.unsubscribe?.())
  }

  private collect(_event: InteractorEvent): void {
    if (this.collected || !this.controller) {
      return
    }
    const ingredient = this.controller.getIngredient(this.ingredientId as CladIngredientId)
    if (!ingredient || this.controller.isReady(ingredient)) {
      return
    }

    this.collected = true
    this.controller.markCollected(this.ingredientId as CladIngredientId)
  }

  private syncVisibility(): void {
    const ingredient = this.controller.getIngredient(this.ingredientId as CladIngredientId)
    const shouldShow = ingredient !== null && !this.controller.isReady(ingredient)
    this.sceneObject.enabled = shouldShow
  }

  private ensureCollider(): void {
    let collider = this.sceneObject.getComponent("Physics.ColliderComponent") as ColliderComponent | null
    if (!collider) {
      collider = this.sceneObject.createComponent("Physics.ColliderComponent") as ColliderComponent
      const shape = Shape.createBoxShape()
      shape.size = new vec3(4.5, 5.5, 5)
      collider.shape = shape
    }
    collider.debugDrawEnabled = false
  }

  private ensureInteractable(): void {
    this.interactable = this.sceneObject.getComponent(Interactable.getTypeName()) as Interactable | null
    if (!this.interactable) {
      this.interactable = this.sceneObject.createComponent(Interactable.getTypeName()) as Interactable
    }
    this.interactable.targetingMode = 3
  }
}
