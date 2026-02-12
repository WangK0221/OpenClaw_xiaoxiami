# Skill Installation Validator

A lightweight validator that prevents incorrect skill installation attempts and provides proper error handling for ClawHub operations.

## Problem Solved

This skill addresses the recurring errors:
- "Skill not found" when attempting to install from HTML files
- Incorrect skill name resolution 
- Unhandled exec command failures during installation

## Features

- **Input Validation**: Validates skill names before attempting installation
- **URL Detection**: Detects when URLs are passed instead of skill names
- **Error Prevention**: Blocks invalid installation attempts before they fail
- **Proper Error Messages**: Provides clear guidance for correct usage
- **Integration**: Works seamlessly with existing clawhub CLI

## Usage

The validator automatically integrates with the system and requires no manual intervention. It intercepts skill installation requests and validates them before execution.