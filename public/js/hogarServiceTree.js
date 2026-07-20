class HogarServiceTree {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`Container #${containerId} not found`);
    this.selectedServices = options.initialServices || [];
    this.onChange = options.onChange || (() => {});
    this.tree = null;
    this.nodeMap = {};
    this.area = null;
  }

  async load() {
    const res = await fetch('/api/v1/service-tree');
    const json = await res.json();
    this.tree = json.data;
    this.nodeMap = {};
    this._indexNodes(this.tree);
  }

  _indexNodes(nodes, parentPath = '') {
    for (const node of nodes) {
      const path = parentPath ? `${parentPath}.${node.id}` : node.id;
      this.nodeMap[path] = node;
      if (node.children) this._indexNodes(node.children, path);
    }
  }

  // Only render the subtree for a given area (top-level node id)
  setArea(area) {
    this.area = area;
    this.render(area);
  }

  setValue(services) {
    this.selectedServices = services || [];
    if (this.area) this.render(this.area);
  }

  getValue() {
    return this.selectedServices;
  }

  render(area) {
    this.container.innerHTML = '';
    let nodes = this.tree;
    if (area) {
      const areaNode = this.tree.find(n => n.id === area);
      nodes = areaNode && areaNode.children ? areaNode.children : [];
      if (!areaNode) {
        this.container.innerHTML = '<p style="color:#888;">Seleccioná un área primero.</p>';
        return;
      }
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'hogar-service-tree';
    this._renderNodes(nodes, wrapper, area || '');
    this.container.appendChild(wrapper);
  }

  _renderNodes(nodes, parentEl, parentPath) {
    for (const node of nodes) {
      const path = parentPath ? `${parentPath}.${node.id}` : node.id;
      const item = document.createElement('div');
      item.className = 'tree-node';

      const header = document.createElement('div');
      header.className = 'tree-node-header';

      const toggle = document.createElement('span');
      toggle.className = 'tree-toggle';
      toggle.textContent = node.children || node.brands?.length ? '▾' : '·';
      toggle.style.cursor = 'pointer';
      header.appendChild(toggle);

      const label = document.createElement('span');
      label.className = 'tree-node-label';
      label.textContent = node.name;
      header.appendChild(label);

      item.appendChild(header);

      const body = document.createElement('div');
      body.className = 'tree-node-body';
      body.style.display = node.children ? 'none' : 'block';

      if (node.children) {
        this._renderNodes(node.children, body, path);
      } else if (node.brands) {
        const brandsContainer = document.createElement('div');
        brandsContainer.className = 'tree-brands';
        const selectAll = document.createElement('label');
        selectAll.className = 'tree-brand-select-all';
        const selectAllCb = document.createElement('input');
        selectAllCb.type = 'checkbox';
        selectAllCb.addEventListener('change', () => {
          const brandChecks = brandsContainer.querySelectorAll('.tree-brand-cb');
          for (const cb of brandChecks) cb.checked = selectAllCb.checked;
          this._updateSelection(path, brandsContainer);
        });
        selectAll.appendChild(selectAllCb);
        selectAll.appendChild(document.createTextNode(' Todas'));
        brandsContainer.appendChild(selectAll);

        for (const brand of node.brands) {
          const brandLabel = document.createElement('label');
          brandLabel.className = 'tree-brand';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.className = 'tree-brand-cb';
          cb.dataset.brand = brand;
          cb.addEventListener('change', () => this._updateSelection(path, brandsContainer));
          brandLabel.appendChild(cb);
          brandLabel.appendChild(document.createTextNode(` ${brand}`));
          brandsContainer.appendChild(brandLabel);
        }
        body.appendChild(brandsContainer);
      }

      item.appendChild(body);
      parentEl.appendChild(item);

      toggle.addEventListener('click', () => {
        const isHidden = body.style.display === 'none';
        body.style.display = isHidden ? 'block' : 'none';
        toggle.textContent = isHidden ? '▴' : (node.children || node.brands?.length ? '▾' : '·');
      });
    }
  }

  _updateSelection(path, brandsContainer) {
    const cbNodes = brandsContainer.querySelectorAll('.tree-brand-cb');
    const selectedBrands = [];
    for (const cb of cbNodes) if (cb.checked) selectedBrands.push(cb.dataset.brand);
    const node = this.nodeMap[path];
    this.selectedServices = this.selectedServices.filter(s => s.path !== path);
    if (selectedBrands.length > 0) {
      this.selectedServices.push({ path, name: node.name, brands: selectedBrands });
    }
    this.onChange(this.selectedServices);
  }
}
