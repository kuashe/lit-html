import {
  html,
  LitElement,
  css,
  PropertyDeclaration,
  PropertyValues,
  UpdatingElement,
} from 'lit-element';
import {property} from 'lit-element/lib/decorators.js';
import {customElement} from 'lit-element/lib/decorators.js';

// IE doesn't support URLSearchParams
const params = document.location.search
  .slice(1)
  .split('&')
  .map((p) => p.split('='))
  .reduce((p: {[key: string]: any}, [k, v]) => ((p[k] = v || true), p), {});

type SimpleItem = {[index: string]: string};

function makeItem(prefix: number) {
  let o: SimpleItem = {};
  for (let i = 0; i < 99; i++) {
    o['value' + i] = prefix + ': ' + i;
  }
  return o;
}

function generateData(count: number) {
  let data = [];
  for (let i = 0; i < count; i++) {
    data.push(makeItem(i));
  }
  return data;
}

const data = generateData(250);
const otherData = generateData(500).slice(250);

const propertyOptions: PropertyDeclaration = {};

let updates: Promise<unknown>[] = [];
const updateComplete = async () => {
  const waitFor = updates;
  updates = [];
  // console.log('updateComplete', waitFor.length);
  await Promise.all(waitFor);
  if (updates.length) {
    await updateComplete();
  } else {
    // await new Promise(r => setTimeout(r, 1000));
  }
};

// Make compatible with previous version
if (Boolean((UpdatingElement.prototype as any).requestUpdateInternal)) {
  UpdatingElement.prototype.requestUpdate = (UpdatingElement.prototype as any).requestUpdateInternal;
}

class MonitorUpdate extends LitElement {
  // Make compatible with previous version
  requestUpdateInternal(
    name?: PropertyKey,
    oldValue?: unknown,
    options?: PropertyDeclaration
  ) {
    this.requestUpdate(name, oldValue, options);
  }

  requestUpdate(
    name?: PropertyKey,
    oldValue?: unknown,
    options?: PropertyDeclaration
  ) {
    const pending = (this as any)._hasRequestedUpdate;
    super.requestUpdate(name, oldValue, options);
    if (!pending && this.hasUpdated) {
      updates.push(this.updateComplete);
    }
  }

  update(changedProperties: PropertyValues) {
    if (!this.hasUpdated) {
      updates.push(this.updateComplete);
    }
    super.update(changedProperties);
  }
}

@customElement('x-thing')
export class XThing extends MonitorUpdate {
  static styles = css`
    .container {
      box-sizing: border-box;
      height: 80px;
      padding: 4px;
      padding-left: 77px;
      line-height: 167%;
      cursor: default;
      background-color: white;
      position: relative;
      color: black;
      background-repeat: no-repeat;
      background-position: 10px 10px;
      background-size: 60px;
      border-bottom: 1px solid #ddd;
    }

    .from {
      display: inline;
      font-weight: bold;
    }

    .time {
      margin-left: 10px;
      font-size: 12px;
      opacity: 0.8;
    }
  `;

  @property(propertyOptions)
  from = '';
  @property(propertyOptions)
  time = '';
  @property(propertyOptions)
  subject = '';

  protected render() {
    return html`
      <div class="container">
        <span class="from">${this.from}</span>
        <span class="time">${this.time}</span>
        <div class="subject">${this.subject}</div>
      </div>
    `;
  }
}

@customElement('x-item')
export class XItem extends MonitorUpdate {
  static styles = css`
    .item {
      display: flex;
    }
  `;

  @property()
  item!: SimpleItem;

  protected render() {
    return html`
      <div @click="${this.onClick}" class="item">
        <x-thing
          .from="${this.item.value0}"
          .time="${this.item.value1}"
          .subject="${this.item.value2}"
        ></x-thing>
        <x-thing
          .from="${this.item.value3}"
          .time="${this.item.value4}"
          .subject="${this.item.value5}"
        ></x-thing>
        <x-thing
          .from="${this.item.value6}"
          .time="${this.item.value7}"
          .subject="${this.item.value8}"
        ></x-thing>
        <x-thing
          .from="${this.item.value9}"
          .time="${this.item.value10}"
          .subject="${this.item.value11}"
        ></x-thing>
        <x-thing
          .from="${this.item.value12}"
          .time="${this.item.value13}"
          .subject="${this.item.value14}"
        ></x-thing>
        <x-thing
          .from="${this.item.value15}"
          .time="${this.item.value16}"
          .subject="${this.item.value17}"
        ></x-thing>
      </div>
    `;
  }

  onClick(e: MouseEvent) {
    console.log(e.type);
  }
}

@customElement('x-app')
export class XApp extends MonitorUpdate {
  @property()
  items = data;

  protected render() {
    return html`${this.items.map(
      (item) => html`<x-item .item="${item}"></x-item>`
    )}`;
  }
}

(async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let el: XApp;

  const create = () => {
    const el = document.createElement('x-app') as XApp;
    return container.appendChild(el) as XApp;
  };

  const destroy = () => {
    container.innerHTML = '';
  };

  const benchmark = params.benchmark;

  // Initial Render
  let test = 'render';
  if (benchmark === test || !benchmark) {
    performance.mark(test);
    create();
    await updateComplete();
    performance.measure(test, test);
    destroy();
  }

  // Update: toggle data
  const updateCount = 6;
  test = 'update';
  if (benchmark === test || !benchmark) {
    el = create();
    performance.mark(test);
    for (let i = 0; i < updateCount; i++) {
      el.items = i % 2 ? otherData : data;
      await updateComplete();
    }
    performance.measure(test, test);
    destroy();
  }

  test = 'update-reflect';
  if (benchmark === test || !benchmark) {
    el = create();
    performance.mark(test);
    (propertyOptions as any).reflect = true;
    for (let i = 0; i < updateCount; i++) {
      el.items = i % 2 ? otherData : data;
      await updateComplete();
    }
    (propertyOptions as any).reflect = false;
    performance.measure(test, test);
    destroy();
  }

  // Log
  performance
    .getEntriesByType('measure')
    .forEach((m) => console.log(`${m.name}: ${m.duration.toFixed(3)}ms`));
})();
