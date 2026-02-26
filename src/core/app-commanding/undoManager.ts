import { type AppCommandEnvelope, type UndoResult } from './appCommandBus'

export type UndoEntry = {
    envelope: AppCommandEnvelope
    undoResult: UndoResult
}

class UndoManagerClass {
    private undoStack: UndoEntry[] = []
    private redoStack: UndoEntry[] = []

    push(entry: UndoEntry) {
        this.undoStack.push(entry)
        this.redoStack = [] // Clear redo stack on new action
    }

    undo() {
        const entry = this.undoStack.pop()
        if (!entry) return
        entry.undoResult.undo()
        this.redoStack.push(entry)
    }

    redo() {
        const entry = this.redoStack.pop()
        if (!entry) return
        entry.undoResult.redo()
        this.undoStack.push(entry)
    }

    clear() {
        this.undoStack = []
        this.redoStack = []
    }

    get state() {
        return {
            undoCount: this.undoStack.length,
            redoCount: this.redoStack.length,
        }
    }
}

export const undoManager = new UndoManagerClass()
