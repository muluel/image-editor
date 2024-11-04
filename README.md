# Rectangle Drawing Application Documentation

<!-- [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) -->

A canvas-based web application for creating, manipulating, and managing rectangles in a browser environment.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)

## Overview

A lightweight, interactive web application that allows users to create, manipulate, and manage rectangles on a canvas. This tool provides an intuitive interface for drawing rectangles, adjusting their size and position, and performing basic editing operations. Ideal for quick sketches, layout planning, or as a foundation for more complex drawing tools.

Key features:

- Easy rectangle creation with click-and-drag functionality
- Move and resize existing rectangles
- Undo/redo capabilities for easy error correction
- Clear all function for quick resets
- Real-time display of rectangle dimensions

Built with [Vanilla JavaScript](https://www.javascript.com/) and [Django](https://www.djangoproject.com/), this application offers a responsive and smooth user experience across different devices and browsers.

## Features

### Drawing Tools

- Draw Mode: Create rectangles by clicking and dragging on the canvas
- Move Mode: Select and move existing rectangles using mouse or arrow keys

### Rectangle Management

- Deletion: Remove rectangles individually using the delete button (×)
- Clear All: Remove all rectangles at once
- Undo/Redo: Support for reversing actions

### Rectangle Properties

- Position (X, Y coordinates)
- Dimensions (Width, Height)
- Visual selection state
- Real-time dimension updates

## Installation

### Prerequisites

- Docker
- Docker Compose plugin

### Steps

1. Install Docker Compose plugin:
   Follow the official [Docker Compose installation guide](https://docs.docker.com/compose/install/).

    > Note: Be aware that you are installing the plugin, not the docker-compose app. The app is run with a dash (-), while the plugin is run with the Docker CLI.

2. Clone the repository

    ```sh
    git clone git@github.com:muluel/image-editor.git
    ```

3. Navigate to the project directory

    ```sh
    cd image-editor
    ```

4. Start the application

    ```sh
    docker compose up -d
    ```

### Usage

1. Open your web browser and go to
    <http://localhost:3000>

### Contact

Muhammed Uluel - <mhmmduluel@gmail.com>

Project Link: <https://github.com/muluel/image-editor>
