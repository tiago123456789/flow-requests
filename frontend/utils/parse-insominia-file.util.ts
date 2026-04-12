import yaml from "js-yaml";

let itemsCollection = [];

const getName = (parent, name) => {
  if (parent.trim().length > 0) {
    name = `${parent}_${name}`.replace(/\s|-+/g, "_");
  }
  return name.replace(/\s+/g, "_");
};

const replaceInsominiaEnvToEnvData = (value: string) => {
  const regex = /{{\s*_\.(.*?)\s*}}|{{\s*(.*?)\s*}}/g;
  const replacement = "{{this.state.envData.$1$2}}";
  return String(value).replace(regex, replacement);
};

const convert = (parent = "", items) => {
  if (items.length == 0) {
    return;
  }

  for (const item of items) {
    if (item.children) {
      convert(getName(parent, item.name), item.children);
    } else {
      item.description = item.name;
      item.name = getName(parent, item.name).toLocaleLowerCase();
      itemsCollection.push(parseItemWithoutChildren(item));
    }
  }

  return;
};

function parseItemWithoutChildren(item: { [key: string]: any }) {
  let requestBody: { [key: string]: any } = {};
  Object.keys(item.body || {}).forEach((key) => {
    let value = item.body[key];
    try {
      value = JSON.parse(item.body[key]);
      requestBody = {
        ...requestBody,
        ...value,
      };
    } catch (error) {
      requestBody[key] = item.body[key];
    }
  });

  return {
    description: `${item.description}`,
    name: item.name.toLowerCase().replace(/\s|-/g, "_"),
    url: replaceInsominiaEnvToEnvData(item.url),
    method: item.method,
    body: Object.keys(requestBody || {}).map((key) => ({
      key: key,
      value: replaceInsominiaEnvToEnvData(requestBody[key]),
    })),
    headers: item.headers
      ? item.headers.map((h: any) => ({
          key: h.name,
          value: replaceInsominiaEnvToEnvData(h.value),
        }))
      : [],
  };
}

function parse(content: string) {
  const doc = yaml.load(content) as any;
  itemsCollection = [];

  convert("", doc.collection);
  return itemsCollection;
}

export { parse };
