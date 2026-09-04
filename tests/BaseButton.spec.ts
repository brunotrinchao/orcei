import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import BaseButton from "../app/components/ui/BaseButton.vue";

describe("BaseButton Component", () => {
  it("renderiza corretamente com o texto do slot", async () => {
    const wrapper = await mountSuspended(BaseButton, {
      slots: {
        default: () => "Salvar Alterações",
      },
    });

    expect(wrapper.text()).toContain("Salvar Alterações");
    expect(wrapper.find("button").exists()).toBe(true);
  });

  it("aplica classes de variantes corretamente (primary, danger, ia, whatsapp)", async () => {
    const wrapperPrimary = await mountSuspended(BaseButton, {
      props: { variant: "primary" },
    });
    expect(wrapperPrimary.classes()).toContain("bg-brand");

    const wrapperDanger = await mountSuspended(BaseButton, {
      props: { variant: "danger" },
    });
    expect(wrapperDanger.classes()).toContain("bg-red-500");

    const wrapperIa = await mountSuspended(BaseButton, {
      props: { variant: "ia" },
    });
    expect(wrapperIa.classes()).toContain("from-violet-600");
  });

  it("exibe spinner de loading e desabilita o botão quando loading é true", async () => {
    const wrapper = await mountSuspended(BaseButton, {
      props: { loading: true },
    });

    expect(wrapper.attributes("disabled")).toBeDefined();
    expect(wrapper.find(".animate-spin").exists()).toBe(true);
  });

  it("suporta renderização de tooltip quando a prop tooltip é informada", async () => {
    const wrapper = await mountSuspended(BaseButton, {
      props: {
        tooltip: "Dica explicativa do botão",
        tooltipSide: "top",
      },
      slots: {
        default: () => "Ação com Tooltip",
      },
    });

    expect(wrapper.find("button").attributes("title")).toBe(
      "Dica explicativa do botão",
    );
    expect(wrapper.find("button").attributes("aria-label")).toBe(
      "Dica explicativa do botão",
    );
    expect(wrapper.text()).toContain("Ação com Tooltip");
  });

  it("dispara evento de click no botão interno mesmo quando tooltip é informado", async () => {
    let clicked = false;
    const wrapper = await mountSuspended(BaseButton, {
      props: {
        tooltip: "Consumir 1 crédito",
      },
      attrs: {
        onClick: () => {
          clicked = true;
        },
      },
      slots: {
        default: () => "Usar IA",
      },
    });

    await wrapper.find("button").trigger("click");
    expect(clicked).toBe(true);
  });

  it("renderiza uma tag <a> quando type é link ou a, ou quando href é informado", async () => {
    const wrapperLink = await mountSuspended(BaseButton, {
      props: {
        type: "link",
        href: "https://orceifacil.com.br",
        target: "_blank",
      },
      slots: {
        default: () => "Abrir Site",
      },
    });

    expect(wrapperLink.find("a").exists()).toBe(true);
    expect(wrapperLink.find("a").attributes("href")).toBe(
      "https://orceifacil.com.br",
    );
    expect(wrapperLink.find("a").attributes("target")).toBe("_blank");
    expect(wrapperLink.text()).toContain("Abrir Site");

    const wrapperTypeA = await mountSuspended(BaseButton, {
      props: {
        type: "a",
        href: "/relatorios",
      },
    });

    expect(wrapperTypeA.find("a").exists()).toBe(true);
    expect(wrapperTypeA.find("a").attributes("href")).toBe("/relatorios");
  });

  it("aplica classes de tamanhos corretamente (xs, sm, md, lg)", async () => {
    const wrapperDefault = await mountSuspended(BaseButton, {
      props: { size: "lg" },
    });
    expect(wrapperDefault.classes()).toContain("px-8");
    expect(wrapperDefault.classes()).toContain("py-5");

    const wrapperSmall = await mountSuspended(BaseButton, {
      props: { size: "xs" },
    });
    expect(wrapperSmall.classes()).toContain("px-3");
    expect(wrapperSmall.classes()).toContain("py-1.5");
  });

  it("aplica a classe w-full quando a prop block é verdadeira", async () => {
    const wrapperBlock = await mountSuspended(BaseButton, {
      props: { block: true },
    });
    expect(wrapperBlock.classes()).toContain("w-full");
  });
});
