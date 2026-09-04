import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { h } from "vue";
import BaseDropdownMenu from "../app/components/ui/BaseDropdownMenu.vue";
import BaseDropdownMenuItem from "../app/components/ui/BaseDropdownMenuItem.vue";

describe("BaseDropdownMenu Component", () => {
  it("renderiza o trigger padrão e o conteúdo do menu quando aberto", async () => {
    const wrapper = await mountSuspended(BaseDropdownMenu, {
      props: {
        open: true,
      },
      slots: {
        default: () => h(BaseDropdownMenuItem, () => "Item do Menu"),
      },
    });

    expect(document.body.innerHTML).toContain("Item do Menu");
  });

  it("abre o menu ao clicar no botão trigger quando a prop open não é fornecida", async () => {
    const wrapper = await mountSuspended(BaseDropdownMenu, {
      slots: {
        default: () => h(BaseDropdownMenuItem, () => "Opção Clicável"),
      },
    });

    const button = wrapper.find("button");
    expect(button.exists()).toBe(true);
    await button.trigger("click");
    expect(document.body.innerHTML).toContain("Opção Clicável");
  });

  it("renderiza itens com a tag <a> quando a propriedade href é fornecida no BaseDropdownMenuItem", async () => {
    const wrapper = await mountSuspended(BaseDropdownMenu, {
      props: {
        open: true,
      },
      slots: {
        default: () =>
          h(
            BaseDropdownMenuItem,
            {
              href: "https://orceifacil.com.br",
              target: "_blank",
            },
            () => "Visitar Site",
          ),
      },
    });

    const link = document.body.querySelector(
      'a[href="https://orceifacil.com.br"]',
    );
    expect(link).not.toBeNull();
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.textContent).toContain("Visitar Site");
  });

  it("renderiza lista declarativa de itens via prop items", async () => {
    const wrapper = await mountSuspended(BaseDropdownMenu, {
      props: {
        open: true,
        items: [
          { label: "Editar", href: "/editar" },
          { label: "Excluir", variant: "danger" },
        ],
      },
    });

    expect(document.body.innerHTML).toContain("Editar");
    expect(document.body.innerHTML).toContain("Excluir");
  });
});
