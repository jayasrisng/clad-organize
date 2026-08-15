import {CladIngredientId, CladOrganizeController} from "./CladOrganizeController"

@component
export class CladMarketEnvironmentUI extends BaseScriptComponent {
  @input
  controller!: CladOrganizeController

  @input
  marketVisuals!: SceneObject

  private labelsRoot: SceneObject | null = null
  private unsubscribe: (() => void) | null = null
  private itemLabels: Array<{id: CladIngredientId; label: SceneObject; text: Text}> = []
  private sectionLabels: Text[] = []

  onAwake(): void {
    this.sceneObject.createComponent("Component.Canvas")
    this.labelsRoot = global.scene.createSceneObject("Market Labels")
    this.labelsRoot.setParent(this.sceneObject)

    this.sectionLabels.push(this.addLabel("PRODUCE", new vec3(-38, 13, 7), 48, 700))
    this.addItemLabel("onion", "Onion", new vec3(-45, 5, 7))
    this.addItemLabel("mint", "Mint", new vec3(-38, 5, 7))
    this.addItemLabel("cilantro", "Cilantro", new vec3(-31, 5, 7))

    this.sectionLabels.push(this.addLabel("DAIRY", new vec3(0, 13, 7), 48, 700))
    this.addItemLabel("yogurt", "Yogurt", new vec3(-5, 5, 7))
    this.addItemLabel("ghee", "Ghee", new vec3(5, 5, 7))

    this.sectionLabels.push(this.addLabel("PROTEIN / PANTRY", new vec3(38, 13, 7), 42, 700))
    this.addItemLabel("chicken", "Chicken", new vec3(31, 5, 7))
    this.addItemLabel("basmati-rice", "Basmati Rice", new vec3(38, 5, 7))
    this.addItemLabel("biryani-spices", "Biryani Spices", new vec3(45, 5, 7))

    this.createEvent("OnStartEvent").bind(() => {
      if (!this.controller || !this.marketVisuals || !this.labelsRoot) {
        print("CLAD Market Environment: controller and marketVisuals inputs are required.")
        return
      }
      this.unsubscribe = this.controller.subscribe(() => this.updateVisibility())
      this.updateVisibility()
    })

    this.createEvent("OnDestroyEvent").bind(() => this.unsubscribe?.())
  }

  private updateVisibility(): void {
    const visible = this.controller.getCurrentPhase() === "market"
    this.marketVisuals.enabled = visible
    if (this.labelsRoot) {
      this.labelsRoot.enabled = visible
    }
    this.itemLabels.forEach(({id, label}) => {
      const ingredient = this.controller.getIngredient(id)
      label.enabled = visible && ingredient !== null && !this.controller.isReady(ingredient)
    })
    this.itemLabels.forEach(({id, text}) => {
      const ingredient = this.controller.getIngredient(id)
      if (ingredient) {
        text.text = ingredient.displayName
      }
    })

    const isDinnerHosting = this.controller.getPlanTitle() === "Dinner Hosting"
    const sections = isDinnerHosting ? ["TABLE", "SERVE", "DINNER"] : ["PRODUCE", "DAIRY", "PROTEIN / PANTRY"]
    this.sectionLabels.forEach((label, index) => {
      label.text = sections[index]
    })
  }

  private addLabel(value: string, position: vec3, size: number, weight: number): Text {
    const labelObject = global.scene.createSceneObject(`Label ${value}`)
    labelObject.setParent(this.labelsRoot!)
    labelObject.getTransform().setLocalPosition(position)
    const label = labelObject.createComponent("Component.Text") as Text
    label.text = value
    label.size = size
    ;(label as Text & {weight?: number}).weight = weight
    label.depthTest = true
    label.horizontalAlignment = HorizontalAlignment.Center
    label.verticalAlignment = VerticalAlignment.Center
    label.horizontalOverflow = HorizontalOverflow.Overflow
    label.verticalOverflow = VerticalOverflow.Overflow
    label.layoutRect = Rect.create(-8, 8, -1.5, 1.5)
    return label
  }

  private addItemLabel(id: CladIngredientId, value: string, position: vec3): void {
    const labelObject = global.scene.createSceneObject(`Label ${value}`)
    labelObject.setParent(this.labelsRoot!)
    labelObject.getTransform().setLocalPosition(position)
    const label = labelObject.createComponent("Component.Text") as Text
    label.text = value
    label.size = 35
    ;(label as Text & {weight?: number}).weight = 500
    label.depthTest = true
    label.horizontalAlignment = HorizontalAlignment.Center
    label.verticalAlignment = VerticalAlignment.Center
    label.horizontalOverflow = HorizontalOverflow.Overflow
    label.verticalOverflow = VerticalOverflow.Overflow
    label.layoutRect = Rect.create(-8, 8, -1.5, 1.5)
    this.itemLabels.push({id, label: labelObject, text: label})
  }
}
