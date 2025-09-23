(function() {
    console.log('Enhanced Content Loader v2.3 - Fixed logging & performance');
    
    let loadedFiles = new Set(); // Track successfully loaded files
    let isInitialLoad = true;
    
    document.addEventListener('DOMContentLoaded', loadAllContent);
    const intervalId = setInterval(loadAllContent, 3000);
    
    async function loadAllContent() {
        const contentFiles = [
            'ask-problem-definition.txt', 'ask-stakeholder-analysis.txt', 'ask-success-criteria.txt',
            'evidence-scientific-methods.txt', 'evidence-scientific-sources.txt', 'evidence-scientific-appraisal.txt',
            'evidence-practitioner-methods.txt', 'evidence-practitioner-sources.txt', 'evidence-practitioner-appraisal.txt',
            'evidence-organizational-methods.txt', 'evidence-organizational-sources.txt', 'evidence-organizational-appraisal.txt',
            'evidence-stakeholder-methods.txt', 'evidence-stakeholder-sources.txt', 'evidence-stakeholder-appraisal.txt',
            'synthesis-integration.txt', 'application-implementation.txt', 'assessment-monitoring.txt'
        ];
        
        let newFilesLoaded = 0;
        
        for (let filename of contentFiles) {
            // Skip files we've already successfully loaded
            if (loadedFiles.has(filename)) {
                continue;
            }
            
            try {
                const response = await fetch(`content/${filename}`);
                
                if (response.ok) {
                    const content = response.text ? await response.text() : '';
                    
                    // Find the target container by ID using proper mapping
                    const idMapping = {
                        'ask-problem-definition.txt': 'problem-definition-content',
                        'ask-stakeholder-analysis.txt': 'stakeholder-analysis-content', 
                        'ask-success-criteria.txt': 'success-criteria-content',
                        'evidence-scientific-methods.txt': 'scientific-methods-content',
                        'evidence-scientific-sources.txt': 'scientific-sources-content',
                        'evidence-scientific-appraisal.txt': 'scientific-appraisal-content',
                        'evidence-practitioner-methods.txt': 'practitioner-methods-content',
                        'evidence-practitioner-sources.txt': 'practitioner-sources-content',
                        'evidence-practitioner-appraisal.txt': 'practitioner-appraisal-content',
                        'evidence-organizational-methods.txt': 'organizational-methods-content',
                        'evidence-organizational-sources.txt': 'organizational-sources-content',
                        'evidence-organizational-appraisal.txt': 'organizational-appraisal-content',
                        'evidence-stakeholder-methods.txt': 'stakeholder-methods-content',
                        'evidence-stakeholder-sources.txt': 'stakeholder-sources-content',
                        'evidence-stakeholder-appraisal.txt': 'stakeholder-appraisal-content',
                        'synthesis-integration.txt': 'evidence-synthesis-content',
                        'application-implementation.txt': 'implementation-content',
                        'assessment-monitoring.txt': 'assessment-content'
                    };
                    
                    const targetId = idMapping[filename];
                    const targetDiv = targetId ? document.getElementById(targetId) : null;
                    
                    if (targetDiv) {
                        if (content.trim()) {
                            // Process and display content
                            const processedContent = processContent(content, filename);
                            targetDiv.innerHTML = processedContent;
                            
                            // Update the parent container
                            const parentContainer = targetDiv.closest('.content-file-preview');
                            if (parentContainer) {
                                removePlaceholderHints(parentContainer, filename);
                                parentContainer.style.cursor = 'default';
                                parentContainer.removeAttribute('onclick');
                                parentContainer.title = 'Content loaded from ' + filename;
                                
                                loadedFiles.add(filename);
                                newFilesLoaded++;
                                
                                console.log(`✅ Loaded ${filename} with ${content.length} characters`);
                            }
                        } else {
                            // File exists but is empty
                            if (isInitialLoad) {
                                const parentContainer = targetDiv.closest('.content-file-preview');
                                if (parentContainer) {
                                    removePlaceholderHints(parentContainer, filename);
                                    targetDiv.style.cursor = 'default';
                                    targetDiv.removeAttribute('onclick');
                                    targetDiv.title = 'Content loaded from ' + filename;
                                    
                                    loadedFiles.add(filename);
                                    newFilesLoaded++;
                                    
                                    console.log(`⚠️ Loaded ${filename} as plain text`);
                                }
                            }
                        }
                    } else if (isInitialLoad) {
                        console.log(`❌ No container found for ${filename}`);
                    }
                } else if (response.status === 404 && isInitialLoad) {
                    console.log(`📝 File not found: ${filename} (create this file to see content)`);
                }
            } catch (error) {
                if (isInitialLoad) {
                    console.log(`❌ Network error loading ${filename}:`, error.message);
                }
            }
        }
        
        // Stop checking once all files are loaded or containers are processed
        if (loadedFiles.size === contentFiles.length || 
            (isInitialLoad && newFilesLoaded === 0)) {
            clearInterval(intervalId);
            console.log(`🎉 Content loading complete! Loaded ${loadedFiles.size}/${contentFiles.length} files.`);
        }
        
        isInitialLoad = false;
    }
    
    function removePlaceholderHints(container, filename) {
        const editNotice = container.querySelector('.edit-notice');
        if (editNotice) {
            editNotice.style.display = 'none';
        }
        
        // Remove onclick handler that shows the alert
        container.removeAttribute('onclick');
        container.style.cursor = 'default';
        container.title = `Content loaded from content/${filename}`;
    }
    
    function processContent(content, filename) {
        // If content looks like HTML, render it directly
        if (content.trim().startsWith('<') && content.includes('>')) {
            return content;
        }
        
        // Process markdown-style content
        return processMarkdown(content);
    }
    
    function processMarkdown(content) {
        let processed = content;
        
        // Headers (must come before other processing)
        processed = processed.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
        processed = processed.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        processed = processed.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        processed = processed.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Bold and italic
        processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
        
        // Convert line breaks to paragraphs, but handle lists specially
        const lines = processed.split('\n');
        const result = [];
        let currentParagraph = [];
        let inList = false;
        
        for (let line of lines) {
            line = line.trim();
            
            // Check if this line is a list item
            const isListItem = /^[\d\.\-\*\+]\s/.test(line);
            
            if (isListItem) {
                // If we have a paragraph being built, finish it
                if (currentParagraph.length > 0) {
                    result.push('<p>' + currentParagraph.join(' ') + '</p>');
                    currentParagraph = [];
                }
                
                if (!inList) {
                    result.push('<ul>');
                    inList = true;
                }
                
                // Clean up the list marker and add as list item
                const cleanedLine = line.replace(/^[\d\.\-\*\+]\s/, '');
                result.push('<li>' + cleanedLine + '</li>');
            } else {
                // Close list if we were in one
                if (inList) {
                    result.push('</ul>');
                    inList = false;
                }
                
                if (line === '') {
                    // Empty line - finish current paragraph
                    if (currentParagraph.length > 0) {
                        result.push('<p>' + currentParagraph.join(' ') + '</p>');
                        currentParagraph = [];
                    }
                } else if (line.startsWith('<h') || line.startsWith('<H')) {
                    // Header - finish current paragraph and add header
                    if (currentParagraph.length > 0) {
                        result.push('<p>' + currentParagraph.join(' ') + '</p>');
                        currentParagraph = [];
                    }
                    result.push(line);
                } else {
                    // Regular line - add to current paragraph
                    currentParagraph.push(line);
                }
            }
        }
        
        // Finish any remaining paragraph
        if (currentParagraph.length > 0) {
            result.push('<p>' + currentParagraph.join(' ') + '</p>');
        }
        
        // Close any remaining list
        if (inList) {
            result.push('</ul>');
        }
        
        return wrapConsecutiveLists(result.join('\n'));
    }
    
    function wrapConsecutiveLists(content) {
        // This function handles multiple consecutive <ul> blocks
        return content.replace(/(<\/ul>\s*<ul>)/g, '');
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function escapeAndWrap(content) {
        return '<pre>' + escapeHtml(content) + '</pre>';
    }
    
    window.enableAdvancedContent = function(filename) {
        console.log(`🎨 Advanced Formatting Help for ${filename || 'your content files'}:`);
        console.log('📝 MARKDOWN: # ## ### #### for headers, **bold**, *italic*, - bullets, 1. numbers');
        console.log('🎯 ASK CLAUDE: "Help me format my content with tables and charts"');
        console.log('⚡ ADVANCED: Paste HTML directly into your .txt files');
    };
    
    window.debugContentLoader = function() {
        console.log('🔍 Content Loader Status:');
        console.log(`📁 Files loaded: ${loadedFiles.size}/18`);
        console.log(`📋 Loaded files:`, Array.from(loadedFiles));
    };
    
    console.log('📚 Content Loader ready! Type enableAdvancedContent() or debugContentLoader() in console.');
})();