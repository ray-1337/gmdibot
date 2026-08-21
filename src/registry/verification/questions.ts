import { ComponentTypes, TextInputStyles, ModalActionRow } from "oceanic.js";

export default [
  {
    type: ComponentTypes.ACTION_ROW,
    components: [
      {
        customID: "gd-username",
        label: "Nama pengguna (_username_) GD-mu",
        style: TextInputStyles.SHORT,
        type: ComponentTypes.TEXT_INPUT,
        maxLength: 25,
        required: true,
        placeholder: "GMDIBot"
      }
    ]
  },
  {
    type: ComponentTypes.ACTION_ROW,
    components: [
      {
        customID: "know-gmdi-more",
        label: "Dari mana kamu tahu GMDI?",
        style: TextInputStyles.PARAGRAPH,
        type: ComponentTypes.TEXT_INPUT,
        maxLength: 512,
        required: true,
        placeholder: "Facebook? Teman kamu? (tuliskan nama penggunanya)"
      }
    ]
  },
  {
    type: ComponentTypes.ACTION_ROW,
    components: [
      {
        customID: "robtop-demon",
        label: "Salah satu level Demon RobTop",
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
        label: "Salah satu kreator level GD",
        style: TextInputStyles.SHORT,
        type: ComponentTypes.TEXT_INPUT,
        maxLength: 45,
        required: true,
        placeholder: "(Catatan: Nexus bukan kreator level.)"
      }
    ]
  },
  {
    type: ComponentTypes.ACTION_ROW,
    components: [
      {
        customID: "indonesia-creator-level",
        label: "Salah satu level _rated_ dari Indo",
        style: TextInputStyles.SHORT,
        type: ComponentTypes.TEXT_INPUT,
        maxLength: 25,
        required: true
      }
    ]
  }
] as ModalActionRow[]