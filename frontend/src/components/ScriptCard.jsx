import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// --- ИКОНКИ ---
const EditIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
const DeleteIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const CopyIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>;
const LinkIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>;

// Импортируем твои новые иконки
import saveIcon from '../assets/icons8-сохранить-50.png';
import cancelIcon from '../assets/icons8-отмена-50.png';


function ScriptCard({ script, onUpdate, onDelete, showGoToPostLink }) {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(script.rewrittenText);
    const [isSaving, setIsSaving] = useState(false);
    
    const [isExpanded, setIsExpanded] = useState(false);
    const MAX_SCRIPT_LENGTH = 300;
    const scriptText = script.rewrittenText || '';
    const needsTruncating = scriptText.length > MAX_SCRIPT_LENGTH;
    const displayScript = isExpanded ? scriptText : `${scriptText.substring(0, MAX_SCRIPT_LENGTH)}...`;
    
    const handleSave = async () => {
        setIsSaving(true);
        const success = await onUpdate(script._id, editText);
        if (success) setIsEditing(false);
        setIsSaving(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(script.rewrittenText);
        alert('Текст сценария скопирован!');
    };

    return (
        <div className="script-card-wrapper">
            <div className="script-card-header">
                <div className="script-card-meta">
                    Версия от {new Date(script.createdAt).toLocaleString('ru-RU')}
                </div>
                <div className="script-actions-icons">
                    <button onClick={() => setIsEditing(!isEditing)} title="Редактировать"><EditIcon /></button>
                    <button onClick={() => onDelete(script._id)} title="Удалить"><DeleteIcon /></button>
                </div>
            </div>
            <div className="script-card-content">
                {isEditing ? (
                    <>
                        <textarea value={editText} onChange={(e) => setEditText(e.target.value)} />
                        <div className="edit-actions">
                            <button onClick={handleSave} disabled={isSaving} title="Сохранить">
                                <img src={saveIcon} alt="Сохранить" />
                            </button>
                            <button onClick={() => setIsEditing(false)} title="Отмена">
                                <img src={cancelIcon} alt="Отмена" />
                            </button>
                        </div>
                    </>
                ) : (
                    <p className="script-text">
                        {needsTruncating ? displayScript : scriptText}
                        {needsTruncating && (
                            <span onClick={() => setIsExpanded(!isExpanded)} className="collapse-toggle">
                                {isExpanded ? 'Свернуть' : 'Показать полностью'}
                            </span>
                        )}
                    </p>
                )}
            </div>
            <div className="script-card-footer">
                <button onClick={handleCopy}><CopyIcon /> Копировать текст</button>
                {showGoToPostLink && script.postId && (
                    <button onClick={() => navigate(`/scripts/${script.postId._id}`)}>
                        <LinkIcon /> К посту
                    </button>
                )}
            </div>
        </div>
    );
}

export default ScriptCard;