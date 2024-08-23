import { ComponentTypes, TextInputStyles, ModalActionRow } from "oceanic.js";

export default [
  {
    type: ComponentTypes.ACTION_ROW,
    components: [
      {
        customID: "robtop-demon",
        label: "Sebutkan satu level Demon yang dibuat RobTop",
        style: TextInputStyles.SHORT,
        type: ComponentTypes.TEXT_INPUT,
        maxLength: 25,
        required: true
      }
    ]
  },
  {
    type: ComponentTypes.ACTION_ROW,
    components: [
      {
        customID: "creator-player",
        label: "Salah satu creator GD yang kamu ketahui",
        style: TextInputStyles.SHORT,
        type: ComponentTypes.TEXT_INPUT,
        maxLength: 45,
        required: true
      }
    ]
  },
  {
    type: ComponentTypes.ACTION_ROW,
    components: [
      {
        customID: "indonesia-creator-level",
        label: "Salah satu level buatan creator Indonesia",
        style: TextInputStyles.SHORT,
        type: ComponentTypes.TEXT_INPUT,
        maxLength: 25,
        required: true
      }
    ]
  },
  {
    type: ComponentTypes.ACTION_ROW,
    components: [
      {
        customID: "know-gmdi-more",
        label: "Kamu tahu Geometry Dash Indonesia dari mana?",
        style: TextInputStyles.PARAGRAPH,
        type: ComponentTypes.TEXT_INPUT,
        maxLength: 512,
        required: true
      }
    ]
  },
  {
    type: ComponentTypes.ACTION_ROW,
    components: [
      {
        customID: "gd-username",
        label: "Masukkan username Geometry Dash kamu",
        style: TextInputStyles.SHORT,
        type: ComponentTypes.TEXT_INPUT,
        maxLength: 25,
        required: true,
        placeholder: "GMDIBot"
      }
    ]
  }
] as ModalActionRow[]