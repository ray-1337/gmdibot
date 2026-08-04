import { ComponentTypes, TextInputStyles, ModalActionRow } from "oceanic.js";

export default [
  {
    type: ComponentTypes.ACTION_ROW,
    components: [
      {
        customID: "gd-username",
        label: "Tuliskan nama pengguna (_username_) GD-mu!",
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
        label: "Dari mana kamu tahu GMDI pertama kali?",
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
        label: "Tuliskan salah satu level Demon dari RobTop!",
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
        label: "Tuliskan salah satu kreator level GD yang kamu ketahui!",
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
        label: "Tuliskan salah satu level _rated_ dari kreator Indonesia!",
        style: TextInputStyles.SHORT,
        type: ComponentTypes.TEXT_INPUT,
        maxLength: 25,
        required: true
      }
    ]
  }
] as ModalActionRow[]