import {
  CladIngredientRecord,
  CladOrganizeController,
} from "./CladOrganizeController"
import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {
  FlexAlign,
  FlexAlignSelf,
  FlexDirection,
  FlexJustify,
} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"

const PANEL_WIDTH_CM = 42
const PANEL_HEIGHT_CM = 52
const PANEL_PADDING_CM = 2.2
const ROW_HEIGHT_CM = 3.8
const MARKET_PANEL_WIDTH_CM = 28
const MARKET_PANEL_HEIGHT_CM = 40
const MARKET_PANEL_PADDING_CM = 1.6
const MARKET_ROW_HEIGHT_CM = 2.6
const COMPLETE_PANEL_WIDTH_CM = 36
const COMPLETE_PANEL_HEIGHT_CM = 27

type TextRole = "Title" | "Subtitle" | "Body" | "Progress"

@component
export class CladChecklistUI extends BaseScriptComponent {
  @input
  controller!: CladOrganizeController

  private content: SceneObject | null = null
  private unsubscribe: (() => void) | null = null
  private plate: BackPlate | null = null
  private panelWidth = PANEL_WIDTH_CM
  private panelHeight = PANEL_HEIGHT_CM
  private panelPadding = PANEL_PADDING_CM
  private rowHeight = ROW_HEIGHT_CM

  onAwake(): void {
    this.sceneObject.createComponent("Component.Canvas")
    this.plate = this.sceneObject.createComponent(BackPlate.getTypeName()) as BackPlate
    this.plate.size = new vec2(PANEL_WIDTH_CM, PANEL_HEIGHT_CM)

    this.createEvent("OnStartEvent").bind(() => {
      if (!this.controller) {
        print("CLAD Checklist: controller input is required.")
        return
      }

      this.unsubscribe = this.controller.subscribe(() => this.render())
      this.render()
    })

    this.createEvent("OnDestroyEvent").bind(() => {
      if (this.unsubscribe) {
        this.unsubscribe()
      }
    })
  }

  private render(): void {
    const phase = this.controller.getCurrentPhase()
    const isBrief = phase === "brief"
    const isMarket = phase === "market"
    const isComplete = phase === "complete"
    this.panelWidth = isComplete ? COMPLETE_PANEL_WIDTH_CM : isMarket ? MARKET_PANEL_WIDTH_CM : PANEL_WIDTH_CM
    this.panelHeight = isComplete ? COMPLETE_PANEL_HEIGHT_CM : isMarket ? MARKET_PANEL_HEIGHT_CM : isBrief ? 31 : PANEL_HEIGHT_CM
    this.panelPadding = isMarket ? MARKET_PANEL_PADDING_CM : PANEL_PADDING_CM
    this.rowHeight = isMarket ? MARKET_ROW_HEIGHT_CM : ROW_HEIGHT_CM
    this.plate!.size = new vec2(this.panelWidth, this.panelHeight)
    this.sceneObject.getTransform().setLocalPosition(
      isMarket ? new vec3(-15, 13, 0) : new vec3(0, 0, 0),
    )

    if (this.content) {
      this.content.destroy()
    }

    this.content = global.scene.createSceneObject("Checklist Content")
    this.content.setParent(this.sceneObject)
    this.content.getTransform().setLocalPosition(new vec3(0, 0, 0.6))

    const list = this.content.createComponent(FlexLayout.getTypeName()) as FlexLayout
    list.onInitialized.add(() => {
      list.width = this.panelWidth
      list.height = this.panelHeight
      list.direction = FlexDirection.Column
      list.alignItems = FlexAlign.Stretch
      list.justifyContent = FlexJustify.Start
      list.rowGap = isMarket ? 0.45 : 0.65
      list.paddingTop = this.panelPadding
      list.paddingBottom = this.panelPadding
      list.paddingLeft = this.panelPadding
      list.paddingRight = this.panelPadding

      if (phase === "brief") {
        this.renderBrief(this.content!)
      } else if (phase === "planning") {
        this.renderPlanning(this.content!)
      } else if (phase === "market") {
        this.renderMarket(this.content!)
      } else if (phase === "complete") {
        this.renderComplete(this.content!)
      }
    })
  }

  private renderBrief(parent: SceneObject): void {
    this.addTextRow(parent, "CLAD Organizer", "Title", 4.4)
    this.addTextRow(parent, "What do you want to organize?", "Subtitle", 2.4)
    this.addTextRow(parent, this.controller.getPromptStatus(), "Body", 3.3)
    this.addTextRow(parent, "Try: “Host dinner for 4”", "Progress", 2.4)
    this.addActionButton(parent, "Type your plan", () => this.controller.openTextPlanner())
    this.addActionButton(parent, "Speak your plan", () => this.controller.startVoicePlanner())
  }

  private renderPlanning(parent: SceneObject): void {
    this.addTextRow(parent, this.controller.getPlanTitle(), "Title", 4.3)
    this.addTextRow(parent, this.controller.getPlanSubtitle(), "Subtitle", 2.0)
    this.addTextRow(parent, `${this.controller.getReadyCount()} / ${this.controller.getTotalCount()} ready`, "Progress", 2.4)

    this.controller.getIngredients().forEach((ingredient) => {
      this.addIngredientRow(parent, ingredient)
    })

    this.addActionButton(parent, "Enter CLAD Market", () => this.controller.enterMarket())
  }

  private renderMarket(parent: SceneObject): void {
    this.addTextRow(parent, "CLAD Market", "Title", 3.5)
    this.addTextRow(parent, "Still Needed", "Subtitle", 1.6)
    this.addTextRow(parent, `${this.controller.getRemainingCount()} remaining`, "Progress", 1.8)

    const needed = this.controller.getIngredients().filter((ingredient) => !this.controller.isReady(ingredient))
    if (needed.length === 0) {
      this.addTextRow(parent, "Everything is ready", "Body", this.rowHeight)
    } else {
      needed.forEach((ingredient) => this.addMarketIngredientRow(parent, ingredient))
    }

    this.addActionButton(parent, "Back", () => this.controller.returnToPlanning())
  }

  private renderComplete(parent: SceneObject): void {
    this.addTextRow(parent, "✓  ✓  ✓", "Progress", 2.5)
    this.addTextRow(parent, "You're all set!", "Title", 4.5)
    this.addTextRow(parent, this.controller.getPlanTitle(), "Subtitle", 2.4)
    this.addTextRow(parent, `${this.controller.getTotalCount()} / ${this.controller.getTotalCount()} items ready`, "Progress", 2.3)
    this.addActionButton(parent, "Reset Demo", () => this.controller.reset())
  }

  private addTextRow(parent: SceneObject, value: string, role: TextRole, height: number): void {
    const row = global.scene.createSceneObject(`Text ${value}`)
    row.setParent(parent)

    const text = row.createComponent("Component.Text") as Text
    text.text = value
    text.depthTest = true
    text.horizontalAlignment = HorizontalAlignment.Center
    text.verticalAlignment = VerticalAlignment.Center
    text.horizontalOverflow = HorizontalOverflow.Overflow
    text.verticalOverflow = VerticalOverflow.Overflow
    text.layoutRect = Rect.create(-0.5, 0.5, -0.5, 0.5)
    this.applyTextRole(text, role)

    const item = row.createComponent(FlexItem.getTypeName()) as FlexItem
    item.alignSelf = FlexAlignSelf.Stretch
    item.overrideHeight = height
    parent.getComponent(FlexLayout.getTypeName())!.addItems([item])
  }

  private addIngredientRow(parent: SceneObject, ingredient: CladIngredientRecord): void {
    const row = global.scene.createSceneObject(`Ingredient ${ingredient.id}`)
    row.setParent(parent)

    const button = row.createComponent(Button.getTypeName()) as Button
    button.size = new vec3(PANEL_WIDTH_CM - PANEL_PADDING_CM * 2, ROW_HEIGHT_CM, 1)
    button.onTriggerUp.add(() => this.controller.toggleAlreadyOwned(ingredient.id))

    const labelObject = global.scene.createSceneObject("Label")
    labelObject.setParent(row)
    labelObject.getTransform().setLocalPosition(new vec3(0, 0, 0.08))
    const label = labelObject.createComponent("Component.Text") as Text
    label.text = `${this.controller.isReady(ingredient) ? "✓" : "○"}  ${ingredient.displayName}`
    label.depthTest = true
    label.horizontalAlignment = HorizontalAlignment.Left
    label.verticalAlignment = VerticalAlignment.Center
    label.horizontalOverflow = HorizontalOverflow.Overflow
    label.verticalOverflow = VerticalOverflow.Overflow
    const halfWidth = this.panelWidth / 2 - 1
    label.layoutRect = Rect.create(-halfWidth, halfWidth, -1.2, 1.2)
    this.applyTextRole(label, "Body")

    const item = row.createComponent(FlexItem.getTypeName()) as FlexItem
    item.alignSelf = FlexAlignSelf.Stretch
    item.overrideHeight = this.rowHeight
    parent.getComponent(FlexLayout.getTypeName())!.addItems([item])
  }

  private addMarketIngredientRow(parent: SceneObject, ingredient: CladIngredientRecord): void {
    const row = global.scene.createSceneObject(`Needed ${ingredient.id}`)
    row.setParent(parent)

    const label = row.createComponent("Component.Text") as Text
    label.text = `○  ${ingredient.displayName}`
    label.depthTest = true
    label.horizontalAlignment = HorizontalAlignment.Left
    label.verticalAlignment = VerticalAlignment.Center
    label.horizontalOverflow = HorizontalOverflow.Overflow
    label.verticalOverflow = VerticalOverflow.Overflow
    const halfWidth = this.panelWidth / 2 - 1
    label.layoutRect = Rect.create(-halfWidth, halfWidth, -1.2, 1.2)
    this.applyTextRole(label, "Body")

    const item = row.createComponent(FlexItem.getTypeName()) as FlexItem
    item.alignSelf = FlexAlignSelf.Stretch
    item.overrideHeight = this.rowHeight
    parent.getComponent(FlexLayout.getTypeName())!.addItems([item])
  }

  private addActionButton(parent: SceneObject, labelText: string, onTrigger: () => void): void {
    const row = global.scene.createSceneObject(`Action ${labelText}`)
    row.setParent(parent)

    const button = row.createComponent(Button.getTypeName()) as Button
    button.size = new vec3(this.panelWidth - this.panelPadding * 2, this.rowHeight, 1)
    button.onTriggerUp.add(onTrigger)

    const labelObject = global.scene.createSceneObject("Label")
    labelObject.setParent(row)
    labelObject.getTransform().setLocalPosition(new vec3(0, 0, 0.08))
    const label = labelObject.createComponent("Component.Text") as Text
    label.text = labelText
    label.depthTest = true
    label.horizontalAlignment = HorizontalAlignment.Center
    label.verticalAlignment = VerticalAlignment.Center
    label.horizontalOverflow = HorizontalOverflow.Overflow
    label.verticalOverflow = VerticalOverflow.Overflow
    const halfWidth = this.panelWidth / 2 - 1
    label.layoutRect = Rect.create(-halfWidth, halfWidth, -1.2, 1.2)
    this.applyTextRole(label, "Progress")

    const item = row.createComponent(FlexItem.getTypeName()) as FlexItem
    item.alignSelf = FlexAlignSelf.Stretch
    item.overrideHeight = this.rowHeight
    parent.getComponent(FlexLayout.getTypeName())!.addItems([item])
  }

  private applyTextRole(text: Text, role: TextRole): void {
    const style = {
      Title: {size: 93, weight: 700},
      Subtitle: {size: 41, weight: 700},
      Body: {size: 39, weight: 500},
      Progress: {size: 39, weight: 700},
    }[role]
    text.size = style.size
    ;(text as Text & {weight?: number}).weight = style.weight
  }
}
