// plopfile.js
module.exports = function (
  /** @type {import('plop').NodePlopAPI} */
  plop
) {
  const createComponent = {
    type: 'add',
    path: 'src/components/{{name}}/{{name}}.tsx',
    templateFile: 'plop-templates/component.hbs',
  }
  const createComponentTest = {
    type: 'add',
    path: 'src/components/{{name}}/{{name}}.test.tsx',
    templateFile: 'plop-templates/component.test.hbs',
  }

  // component folder generator
  plop.setGenerator('component', {
    description: 'create react component folder',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'component name please',
      },
    ],
    actions: [createComponent, createComponentTest],
  })

  // component test generator
  plop.setGenerator('component-test', {
    description: 'create react component test',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'component name please',
      },
    ],
    actions: [createComponentTest],
  })
}
