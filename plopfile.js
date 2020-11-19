// plopfile.js

const createComponent = {
  type: "add",
  path: "src/components/{{capitalize name}}/{{capitalize name}}.tsx",
  templateFile: "plop-templates/component.hbs",
};

const createComponentTest = {
  type: "add",
  path: "src/components/{{capitalize name}}/{{capitalize name}}.test.tsx",
  templateFile: "plop-templates/component.test.hbs",
};

const createPage = {
  type: "add",
  path: "pages/{{name}}.tsx",
  templateFile: "plop-templates/page.hbs",
};

const createPageTest = {
  type: "add",
  path: "src/__test__/{{name}}.test.tsx",
  templateFile: "plop-templates/page.test.hbs",
};

module.exports = function (
  /** @type {import('plop').NodePlopAPI} */
  plop
) {
  plop.setGenerator("component", {
    description: "create react component",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "component name please",
      },
    ],
    actions: [createComponent, createComponentTest],
  });

  plop.setGenerator("page", {
    description: "create page",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "page name please",
      },
    ],
    actions: [createPage, createPageTest],
  });

  plop.setGenerator("page-test", {
    description: "create page test",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "page name please",
      },
    ],
    actions: [createPageTest],
  });

  // helper
  plop.setHelper("capitalize", function (text) {
    text = text.split("");
    text[0] = text[0].toUpperCase();
    return text.join("");
  });
};
