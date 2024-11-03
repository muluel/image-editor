export class CanvasManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.rectangles = [];
        this.selectedRect = null;
        this.backgroundImage = null;
        this.tempRect = null;

        this.isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)

        this.undoStack = [];
        this.redoStack = [];

        this.isDrawMode = false;
        this.moveStep = 1;

        this.initializeEventListeners();
        this.initializeTooltips();
        this.initializeShortcutsPanel();
        this.addRectangleList();
    }

    initializeEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));

        document.addEventListener('keydown', this.handleKeyDown.bind(this))

        const toggleButton = document.getElementById('toggleModeBtn');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggleDrawMode());
        }
    }

    initializeTooltips() {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            const action = btn.textContent;
            const shortcut = this.getShortcutForAction(action);
            if (shortcut) {
                btn.setAttribute('data-tooltip', shortcut);
            }
        });
    }

    getShortcutForAction(action) {
        const shortcuts = {
            'Greyscale': 'G',
            'Save Image': this.isMac ? '⌘ + S' : 'Ctrl + S', // TODO
            'Clear Rectangles': this.isMac ? '⌘ + Delete' : 'Ctrl + Delete',
            'Undo Last Rectangle': this.isMac ? '⌘ + Z' : 'Ctrl + Z'
        };
        return shortcuts[action] || '';
    }

    initializeShortcutsPanel() {
        const toggleBtn = document.querySelector('.toggle-shortcuts');
        const content = document.querySelector('.shortcuts-content');
        
        toggleBtn.addEventListener('click', () => {
            toggleBtn.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
        });
    }

    handleKeyDown(e) {
        const ctrlOrCmd = this.isMac ? e.metaKey : e.ctrlKey;

        const isDeleteKey = this.isMac ? 
        (e.key === 'Delete' || (e.key === 'Backspace' && e.metaKey)) :
        (e.key === 'Delete');

        if (isDeleteKey && this.selectedRect) {
            e.preventDefault();
            
            const index = this.rectangles.indexOf(this.selectedRect);
            if (index !== -1) {
                this.saveState();
                this.removeRectangle(index);
                this.selectedRect = null;
                this.showFeedback('Rectangle Deleted')
            }
        }

        if (ctrlOrCmd && !e.shiftKey && e.key === 'z') {
            e.preventDefault();
            this.undo();
            this.showFeedback('Undo');
        }

        if (ctrlOrCmd && e.shiftKey && e.key === 'z') {
            e.preventDefault();
            this.redo();
            this.showFeedback('Redo');
        }

        if (e.code === 'Space') {
            e.preventDefault();
            this.toggleDrawMode();
        }

        if (this.selectedRect && !this.isDrawing && !this.isDragging) {
            const shift = e.shiftKey ? 15 : 1; // Faster movement with shift
            let moved = false;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.selectedRect.x = Math.min(
                        this.canvas.width - this.selectedRect.width,
                        this.selectedRect.x - shift
                    );
                    moved = true;
                    break;
                    
                case 'ArrowRight':
                    e.preventDefault();
                    this.selectedRect.x = Math.min(
                        this.canvas.width - this.selectedRect.width,
                        this.selectedRect.x + shift
                    );
                    moved = true;
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectedRect.y = Math.min(
                        this.canvas.height - this.selectedRect.height,
                        this.selectedRect.y - shift
                    )
                    moved = true
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectedRect.y = Math.min(
                        this.canvas.height - this.selectedRect.height,
                        this.selectedRect.y + shift
                    );
                    moved = true;
                    break;
            }
            if (moved) {
                this.updateRectangleSpecs(this.selectedRect);
                this.redraw();
                this.showFeedback('Moved');
            }
        }

        if (e.key === 'Escape') {
            if (this.selectedRect){
                this.selectedRect = null;
                this.redraw();
                this.updateRectangleSpecs({
                    x: 10, y: 10, width: 1000, height: 100,
                });
                this.showFeedback('Deselected');
            }
        }
    }

    showFeedback(message) {        
        let feedback = document.getElementById('action-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'action-feedback';
            feedback.style.position = 'fixed';
            feedback.style.top= '20px';
            feedback.style.right = '20px';
            feedback.style.padding = '10px 20px';
            feedback.style.background = 'rgba(0, 0, 0, 0.8)';
            feedback.style.color = 'white';
            feedback.style.borderRadius = '4px';
            feedback.style.zIndex = '1000';
            feedback.style.background = "#ff4242";
            document.body.appendChild(feedback);
        }
    
        feedback.style.display = 'block';
        feedback.textContent = message;
        feedback.classList.remove('feedback-animation');
        void feedback.offsetWidth;
        feedback.classList.add('feedback-animation');
    
        setTimeout(() => {
            feedback.style.display = 'none';
        }, 2000);
    }

    saveState() {
        const stateCopy = this.rectangles.map(rect => ({ ...rect }));
        this.undoStack.push(stateCopy);
        this.redoStack = [];
    }

    undo(){
        if (this.undoStack.length > 0) {
            const currentState = this.rectangles.map(rect => ({ ...rect }));
            this.redoStack.push(currentState);

            this.rectangles = this.undoStack.pop();
            this.selectedRect = null;
            this.redraw();

            this.updateRectangleSpecs({
                x: 10,
                y: 10,
                width: 100,
                height: 100,
            });
        }
    }

    redo(){
        if (this.redoStack.length > 0) {
            const currentState = this.rectangles.map(rect => ({ ...rect }));
            this.undoStack.push(currentState);

            this.rectangles = this.redoStack.pop();
            this.selectedRect = null;
            this.redraw();

            this.updateRectangleSpecs({
                x: 10,
                y: 10,
                width: 100,
                height: 100,
            });
        }
    }

    setBackgroundImage(imageElement) {
        this.backgroundImage = imageElement;
        this.canvas.width = imageElement.width;
        this.canvas.height = imageElement.height;
        this.canvas.style.width = `${imageElement.width}px`;
        this.canvas.style.height = `${imageElement.height}px`;
        this.redraw();
    }

    handleMouseDown(e) {
        const { x, y } = this.getMousePosition(e);
        
        if (this.isDrawMode) {
            this.isDrawing = true;
            this.startX = x;
            this.startY = y;
            this.tempRect = {
                x: x,
                y: y,
                width: 0,
                height: 0,
            };
        } else {
            this.selectedRect = [...this.rectangles].reverse().find(r => this.isPointInRectangle(x, y, r));
            if (this.selectedRect) {
                this.isDragging = true;
                this.startX = x - this.selectedRect.x;
                this.startY = y - this.selectedRect.y;
                this.updateRectangleSpecs(this.selectedRect);
                this.redraw();
            }
        }
    }

    handleMouseMove(e) {
        if (!this.isDrawing && !this.isDragging) return;

        const { x, y } = this.getMousePosition(e);

        if (this.isDrawMode && this.isDrawing && this.tempRect){
            this.tempRect.width = x - this.startX;
            this.tempRect.height = y - this.startY;

            const tempRectForSpecs = {
                x: Math.min(this.startX, x),
                y: Math.min(this.startY, y),
                width: Math.abs(this.tempRect.width),
                height: Math.abs(this.tempRect.height),
                color: this.tempRect.color
            };
            this.updateRectangleSpecs(tempRectForSpecs);

            this.redraw();

            this.ctx.fillStyle = this.tempRect.color;
            this.ctx.fillRect(
                this.tempRect.x,
                this.tempRect.y,
                this.tempRect.width,
                this.tempRect.height
            );
        } else if (!this.isDrawMode && this.isDragging && this.selectedRect){
            const newX = x - this.startX;
            const newY = y - this.startY;

            const maxX = this.canvas.width - this.selectedRect.width;
            const maxY = this.canvas.height - this.selectedRect.height;

            this.selectedRect.x = Math.max(0, Math.min(maxX, newX));
            this.selectedRect.y = Math.max(0, Math.min(maxY, newY));

            this.updateRectangleSpecs(this.selectedRect);

            this.redraw();
        }
    }

    handleMouseUp(e) {
        if (this.isDrawMode && this.isDrawing && this.tempRect) {
            const { x, y } = this.getMousePosition(e);
            const width = x - this.startX;
            const height = y - this.startY;
    

            if (Math.abs(width) > 5 && Math.abs(height) > 5) {
                this.saveState();
                
                const newRect = {
                    x: Math.min(this.startX, x),
                    y: Math.min(this.startY, y),
                    width: Math.abs(width),
                    height: Math.abs(height),
                    color: this.tempRect.color
                };
                
                this.rectangles.push(newRect);
                this.selectedRect = newRect;
                this.updateRectangleSpecs(newRect);
                this.showFeedback('Rectangle Created');
            }
        } else if (!this.isDrawMode && this.isDragging && this.selectedRect) {
            this.saveState();
            this.showFeedback('Rectangle Moved');
        }
        else if (this.isDrawing ){
            this.isDrawing = false;
            if (this.tempRect && this.tempRect.width > 5 && this.tempRect.height > 5) {
                this.saveState();
                this.rectangles.push({ ...this.tempRect });
                this.showFeedback('Rectangle Created');
            }
            this.tempRect = null;
        }
    
        this.isDrawing = false;
        this.isDragging = false;
        this.tempRect = null;
        this.redraw();
    }

    updateRectangleSpecs(rect) {
        if (!rect) return;

        const x = Math.round(rect.x);
        const y = Math.round(rect.y);
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);


        document.getElementById('x-pos').value = x;
        document.getElementById('y-pos').value = y;
        document.getElementById('rect-width').value = width;
        document.getElementById('rect-height').value = height;
        
        const rgba = this.parseRgba(rect.color);
        if (rgba) {
            document.getElementById('red').value = rgba.r;
            document.getElementById('green').value = rgba.g;
            document.getElementById('blue').value = rgba.b;
            document.getElementById('alpha').value = Math.round(rgba.a * 100);
            
            const hexColor = `#${rgba.r.toString(16).padStart(2, '0')}${rgba.g.toString(16).padStart(2, '0')}${rgba.b.toString(16).padStart(2, '0')}`;
            document.getElementById('rect-color').value = hexColor;
            
            document.getElementById('color-preview-box').style.backgroundColor = rect.color;
        }
    }

    parseRgba(color) {
        if (!color) return null;
        const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
        if (match) {
            return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3]),
                a: match[4] ? parseFloat(match[4]) : 1
            };
        }

        if (color.startsWith('#')) {
            const r = parseInt(color.substr(1,2), 16);
            const g = parseInt(color.substr(3,2), 16);
            const b = parseInt(color.substr(5,2), 16);
            return {
                r: r,
                g: g,
                b: b,
                a: 1
            };
        }
        return null;
    }

    updateSelectedRectangle(props) {
        if (this.selectedRect) {
            if (props.x !== undefined ) this.selectedRect.x = props.x;
            if (props.y !== undefined ) this.selectedRect.y = props.y;
            if (props.width !== undefined ) this.selectedRect.width = props.width;
            if (props.height !== undefined ) this.selectedRect.height = props.height;
            if (props.color !== undefined ) this.selectedRect.color = props.color;

            this.redraw();
        }
    }

    redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.backgroundImage) {
            this.ctx.drawImage(this.backgroundImage, 0, 0);
        }
        
        this.rectangles.forEach(rect => {
            this.ctx.fillStyle = rect.color;
            this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
            
            if (rect === this.selectedRect) {
                this.ctx.strokeStyle = '#00ff00';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
            }
        });
    }

    addRectangle(x, y, width, height, color) {
        const rect = {
            x: Math.min(x, x + width),
            y: Math.min(y, y + height),
            width: Math.abs(width),
            height: Math.abs(height),
            color
        };
        this.rectangles.push(rect);
        this.redraw();
    }

    getMousePosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    isPointInRectangle(x, y, rect) {
        const tolerance = 1;

        return  x >= rect.x - tolerance &&
                x <= rect.x + rect.width + tolerance &&
                y >= rect.y - tolerance &&
                y <= rect.y + rect.height + tolerance;
    }

    clearRectangles() {
        this.rectangles = [];
        this.redraw();
    }

    undoLastRectangle() {
        if (this.rectangles.length > 0) {
            this.rectangles.pop();
            this.redraw();
        }
    }

    removeRectangle(index) {
        if (index >= 0 && index < this.rectangles.length) {
            this.rectangles.splice(index, 1);
            this.redraw();

            this.updateRectangleSpecs({
                x: 10,
                y: 10,
                width: 100,
                height: 100,
            });
            this.addRectangleList()
        }
    }

    toggleDrawMode() {
        this.isDrawMode = !this.isDrawMode;
        this.canvas.style.cursor = this.isDrawMode ? 'crosshair' : 'default';

        const toggleButton = document.getElementById('toggleModeBtn');
        if (toggleButton) {
            const modeText = toggleButton.querySelector('.mode-text');
            if (modeText) {
                modeText.textContent = this.isDrawMode ? 'Draw Mode' : 'Select Mode';
            }
        }

        this.showFeedback(this.isDrawMode ? 'Draw Mode' : 'Select Mode');
    }

    addRectangleList() {
        // Create or get the rectangle list container
        const listContainer = document.getElementById('rectangle-list') || this.createRectangleList();
        
        // Clear existing list
        listContainer.innerHTML = '';
        
        
        // Create list items for each rectangle
        this.rectangles.forEach((rect) => {
            const listItem = document.createElement('div');
            listItem.className = 'rectangle-list-item';
            if (rect === this.selectedRect) {
                listItem.className += ' selected';
            }
            
            listItem.innerHTML = `
                <span>Rectangle ${index + 1}
                <div class="rectangle-details">
                    <span>X: ${Math.round(rect.x)}
                    <span>Y: ${Math.round(rect.y)}
                    <span>W: ${Math.round(rect.width)}
                    <span>H: ${Math.round(rect.height)}
                </div>
            `;
            
            // Add click handler for selection
            listItem.addEventListener('click', () => {
                this.selectedRect = rect;
                this.updateRectangleSpecs(rect);
                this.redraw();
                this.addRectangleList(); // Refresh list to show selection
            });
            
            // Add delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-rect-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.saveState();
                this.removeRectangle(index);
                this.showFeedback('Rectangle Deleted');
                this.addRectangleList();
            });
            
            listItem.appendChild(deleteBtn);
            listContainer.appendChild(listItem);
        });
    }
    
    createRectangleList() {
        const container = document.createElement('div');
        container.id = 'rectangle-list';
        container.className = 'rectangle-list';
        document.body.appendChild(container);
        return container;
    }

}
