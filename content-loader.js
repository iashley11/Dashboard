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
                    let content = await response.text();
                    
                    // Find the target container
                    const targetDiv = document.querySelector(`[onclick*="${filename}"]`);
                    if (targetDiv) {
                        const pre = targetDiv.querySelector('pre');
                        if (pre) {
                            try {
                                // Enhanced content processing
                                content = processContent(content, filename);
                                pre.innerHTML = content;
                                
                                // CLEAN UP PLACEHOLDERS (only once)
                                removePlaceholderHints(targetDiv, filename);
                                
                                // DISABLE CLICK BEHAVIOR
                                targetDiv.style.cursor = 'default';
                                targetDiv.removeAttribute('onclick');
                                targetDiv.title = 'Content loaded from ' + filename;
                                
                                // Mark as successfully loaded
                                loadedFiles.add(filename);
                                newFilesLoaded++;
                                
                                console.log(`✅ Loaded ${filename}`);
                            } catch (processingError) {
                                // Fallback to plain text
                                pre.textContent = content;
                                removePlaceholderHints(targetDiv, filename);
                                targetDiv.style.cursor = 'default';
                                targetDiv.removeAttribute('onclick');
                                targetDiv.title = 'Content loaded from ' + filename;
                                
                                loadedFiles.add(filename);
                                newFilesLoaded++;
                                
                                console.log(`⚠️ Loaded ${filename} as plain text`);
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
        let removedCount = 0;
        
        // Strategy 1: Remove elements containing placeholder text
        const allElements = container.querySelectorAll('*');
        allElements.forEach(element => {
            const text = element.textContent || '';
            
            if ((text.includes(`📝 content/${filename}`) || 
                 text.includes(`🖊️ Click to edit this file`) ||
                 (text.includes('📝') && text.includes(filename)) ||
                 (text.includes('🖊️') && text.includes('Click to edit'))) &&
                !element.querySelector('pre') && 
                element.tagName !== 'PRE' &&
                element.textContent.length < 150) {
                
                element.style.display = 'none';
                removedCount++;
            }
        });
        
        if (removedCount > 0) {
            console.log(`🧹 Cleaned ${removedCount} placeholder(s) for ${filename}`);
        }
    }
    
    function processContent(content, filename) {
        if (typeof content !== 'string') {
            throw new Error('Content must be a string');
        }
        
        content = content.trim();
        
        if (!content) {
            return '<div style="font-family: inherit; line-height: 1.6; color: #999; font-style: italic;">Content file is empty. Add your content to see it here.</div>';
        }
        
        // Check for HTML content
        if (content.includes('<') && (content.includes('<div') || content.includes('<table') || content.includes('<h') || content.includes('<p'))) {
            if (content.includes('<script') || content.includes('<iframe') || content.includes('javascript:')) {
                console.warn(`⚠️ Potentially unsafe HTML detected in ${filename}, treating as plain text`);
                return escapeAndWrap(content);
            }
            return content;
        }
        
        // Process markdown
        try {
            return processMarkdown(content);
        } catch (error) {
            console.warn(`⚠️ Markdown processing failed for ${filename}:`, error.message);
            return escapeAndWrap(content);
        }
    }
    
    function processMarkdown(content) {
        // Enhanced markdown processing with all header levels
        content = content
            .replace(/^#### (.*$)/gim, '###HEADER4###$1###HEADER4###')
            .replace(/^### (.*$)/gim, '###HEADER3###$1###HEADER3###')
            .replace(/^## (.*$)/gim, '###HEADER2###$1###HEADER2###')
            .replace(/^# (.*$)/gim, '###HEADER1###$1###HEADER1###')
            .replace(/\*\*(.*?)\*\*/g, '###BOLD###$1###BOLD###')
            .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '###ITALIC###$1###ITALIC###')
            .replace(/^- (.*$)/gim, '###LISTITEM###$1###LISTITEM###')
            .replace(/^(\d+)\. (.*$)/gim, '###NUMITEM###$2###NUMITEM###');
        
        content = escapeHtml(content);
        
        content = content
            .replace(/###HEADER1###(.*?)###HEADER1###/g, '<h3 style="color: #2c3e50; margin-top: 20px; margin-bottom: 10px; font-weight: 600;">$1</h3>')
            .replace(/###HEADER2###(.*?)###HEADER2###/g, '<h4 style="color: #34495e; margin-top: 15px; margin-bottom: 8px; font-weight: 600;">$1</h4>')
            .replace(/###HEADER3###(.*?)###HEADER3###/g, '<h5 style="color: #7f8c8d; margin-top: 10px; margin-bottom: 5px; font-weight: 600;">$1</h5>')
            .replace(/###HEADER4###(.*?)###HEADER4###/g, '<h6 style="color: #95a5a6; margin-top: 8px; margin-bottom: 3px; font-weight: 600; font-size: 0.9em;">$1</h6>')
            .replace(/###BOLD###(.*?)###BOLD###/g, '<strong style="font-weight: 600;">$1</strong>')
            .replace(/###ITALIC###(.*?)###ITALIC###/g, '<em style="font-style: italic;">$1</em>')
            .replace(/###LISTITEM###(.*?)###LISTITEM###/g, '<li style="margin: 5px 0; padding-left: 5px;">$1</li>')
            .replace(/###NUMITEM###(.*?)###NUMITEM###/g, '<li style="margin: 5px 0; padding-left: 5px;">$1</li>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>');
        
        content = wrapConsecutiveLists(content);
        
        return `<div style="font-family: inherit; line-height: 1.6; color: #333; word-wrap: break-word;">${content}</div>`;
    }
    
    function wrapConsecutiveLists(content) {
        content = content.replace(/(<li[^>]*>.*?<\/li>(?:\s*<br>)*)+/gs, function(match) {
            const cleanList = match.replace(/\s*<br>\s*(?=<li|$)/g, '');
            const isNumbered = match.includes('list-style-type: decimal');
            const listTag = isNumbered ? 'ol' : 'ul';
            return `<${listTag} style="margin: 10px 0; padding-left: 25px; list-style-position: outside;">${cleanList}</${listTag}>`;
        });
        return content;
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function escapeAndWrap(content) {
        return `<div style="font-family: inherit; line-height: 1.6; color: #333; white-space: pre-wrap;">${escapeHtml(content)}</div>`;
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