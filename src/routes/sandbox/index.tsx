import { $, component$, type NoSerialize, noSerialize, useSignal, useStore, useTask$, useVisibleTask$ } from '@builder.io/qwik';
// This import statement is just for type information
import type Paper from 'paper';

// Dummy variable for the global paper object
declare const paper: typeof Paper;

const writeVar = (label: string, val: any) => {
    const writeBox = document.querySelector('.write-box') as HTMLElement;
    const existing = writeBox.querySelector(`[var-label=${label}]`);
    if (existing) {
        (existing.querySelector('.val') as HTMLElement).innerHTML = val;
    } else {
        const varElement = Object.assign(document.createElement('div'), {
            className: 'var-wrap',
            innerHTML: `
                <div class="label">${label}:</div>
                <div class="val">${val}</div>
            `
        })
        varElement.setAttribute('var-label', label);

        writeBox.appendChild(varElement)
    }
} 

const clearVar = (labelArrayOrString: string | string[]) => {
    const writeBox = document.querySelector('.write-box') as HTMLElement;
    const labels = Array.isArray(labelArrayOrString) ? labelArrayOrString : [labelArrayOrString];

    for(const l of labels) {
        const existing = writeBox.querySelector(`[var-label=${l}]`);
        if (existing) {
            existing.remove();
        }
    }
}

interface SectorFieldProps extends DrawPlayerProps  {
    circle: paper.Path.Circle,
    sectorRadius: number,
    group: paper.Group,
}

const sectorArray: paper.Path.Arc[] = [];
const sectorIntersectionAreas: { [authorId: number]: { [id: number]: paper.PathItem | undefined } }= {};

const drawSectorFieldOnCircle = (props: SectorFieldProps) => {
    const { circle: playerCircle, sectorRadius, sectorAngle, group, offense, index, theme } = props;

    const getZoom = () => paper.view.zoom;
    const areHandlersDisabled = () => document.body.classList.contains('disable-handlers');

    const center = playerCircle.bounds.center;
    const radius = playerCircle.bounds.height || playerCircle.bounds.width;

    // Define the angle range of the FOV sector
    // May have to refactor to scale later
    const startAngle = 90 - (sectorAngle / 2);  // Always positive
    const endAngle = 90 + (sectorAngle / 2);   // Always > start angle

    const midpointAngle = (endAngle + startAngle) / 2; // Midpoint / Direction of hips

    console.log({midpointAngle})

    // Calculate the start, through, and end points of the arc
    const start = new paper.Point(
        center.x + (radius + sectorRadius) * Math.cos(startAngle * (Math.PI / 180)),
        center.y + (radius + sectorRadius) * -Math.sin(startAngle * (Math.PI / 180))
    );

    const through = new paper.Point(
        center.x + (radius + sectorRadius) * Math.cos(midpointAngle * (Math.PI / 180)),
        center.y + (radius + sectorRadius) * -Math.sin(midpointAngle * (Math.PI / 180))
    );

    const throughCircle = new paper.Path.Circle(through.add(new paper.Point(0, 0)), 10);
    throughCircle.strokeWidth = 2;
    throughCircle.name = 't-circle';

    if (theme == 'dark' && !offense) {
        throughCircle.strokeColor = new paper.Color('#ededed');
    }
    if (theme == 'light' && offense) {
        throughCircle.strokeColor = new paper.Color('#1d1d1d');
    }

    throughCircle.fillColor = offense ? new paper.Color('#fff') : new paper.Color('#000');

    const end = new paper.Point(
        center.x + (radius + sectorRadius) * Math.cos(endAngle * (Math.PI / 180)),
        center.y + (radius + sectorRadius) * -Math.sin(endAngle * (Math.PI / 180))
    );

    
    const sector = Object.assign(new paper.Path.Arc(start, through, end), {
        applyMatrix: false,
        fillColor: theme == 'dark' ? new paper.Color(0, 0, 0, 1) : new paper.Color(1, 1, 1, 1),
        strokeWidth: 1,
        strokeColor: new paper.Color('#2d2d2d')
    });
    sector.lineTo(center);
    sector.lineTo(start);
    sector.closePath();
    sector.sendToBack();
    //group.addChild(sector)

/*     const sectorText = Object.assign(new paper.PointText(sector.bounds.center), {
        justification: 'center',
        content: sector.id,
        fillColor: 'white',
        fontSize: '18px',
        fontFamily: 'Satoshi',
    }); */

    const playerNumber = Object.assign(new paper.PointText(playerCircle.bounds.center.add(new paper.Point(0, 6))), {
        justification: 'center',
        content: `P${index + 1}`,
        fillColor: offense ? 'black' : 'white',
        fontSize: '18px',
        fontFamily: 'Satoshi',
        fontWeight: 600
    });
    playerNumber.applyMatrix = false;
    const playerCircleGroup = new paper.Group([playerCircle, playerNumber])
    group.addChild(playerCircleGroup)

    const startHinter = new paper.Point(
        center.x + (radius + sectorRadius + 20) * Math.cos(80 * (Math.PI / 180)),
        center.y + (radius + sectorRadius + 20) * -Math.sin(80 * (Math.PI / 180))
    );

    const throughHinter = new paper.Point(
        center.x + (radius + sectorRadius + 25) * Math.cos(90 * (Math.PI / 180)),
        center.y + (radius + sectorRadius + 25) * -Math.sin(90 * (Math.PI / 180))
    );

    const endHinter = new paper.Point(
        center.x + (radius + sectorRadius + 20) * Math.cos(100 * (Math.PI / 180)),
        center.y + (radius + sectorRadius + 20) * -Math.sin(100 * (Math.PI / 180))
    );

    const hinterArc = new paper.Path.Arc(startHinter, throughHinter, endHinter);
    hinterArc.strokeColor = new paper.Color('gold');
    hinterArc.strokeWidth = 4;
    hinterArc.opacity = 0;

    const arrowheadStart = new paper.Path({
        strokeColor: new paper.Color('gold'),
        fillColor: new paper.Color('gold'),
        opacity: 0
    });
    
    // Set the arrowhead shape
    arrowheadStart.add(new paper.Point(0, 0));
    arrowheadStart.add(new paper.Point(10, 5));
    arrowheadStart.add(new paper.Point(10, -5));
    arrowheadStart.closed = true;
    arrowheadStart.position = endHinter;
    arrowheadStart.rotate(hinterArc.getTangentAt(0).angle);

    const arrowheadEnd = new paper.Path({
        strokeColor: new paper.Color('gold'),
        fillColor: new paper.Color('gold'),
        opacity: 0
    });
    
    // Set the arrowhead shape
    arrowheadEnd.add(new paper.Point(0, 0));
    arrowheadEnd.add(new paper.Point(10, 5));
    arrowheadEnd.add(new paper.Point(10, -5));
    arrowheadEnd.closed = true;
    arrowheadEnd.position = startHinter;
    arrowheadEnd.rotate(hinterArc.getTangentAt(hinterArc.length).angle + 50);

    group.addChildren([hinterArc, arrowheadStart, arrowheadEnd])
    group.addChild(throughCircle)

    playerCircleGroup.onMouseEnter = function () {
        if (areHandlersDisabled()) return;

        if (group.id === group.parent.lastChild.id) {
            console.log('already at front');
        } else {
            group.bringToFront();
        }


        if (document.querySelector('.sandbox-wrap.move')) return;

        playerCircle.tween({
            scaling: 1.1
        },{
            easing: 'easeOutCubic',
            duration: 200
        })

        document.body.style.cursor = 'grab';
    }
    playerCircleGroup.onMouseLeave = function () {
        playerCircle.tween({
            scaling: 1
        },{
            easing: 'easeOutCubic',
            duration: 200
        })

        document.body.style.cursor = 'default';

        /* enableHandlers();

        document.removeEventListener('mousemove', playerCircleMouseMoveHandler)

        clearVar('circle-y');
        clearVar('circle-x'); */
    }

    const savedPlayerCirclePosition = {
        x: playerCircle.position.x,
        y: playerCircle.position.y
    }
    const savedThroughCirclePosition = {
        x: throughCircle.position.x,
        y: throughCircle.position.y
    }
    
    sectorArray.push(sector);


    const checkSectorIntersections = (currentAuthorId: number) => {
        for(const authorIdKey in sectorIntersectionAreas) {
            const authorId = parseInt(authorIdKey);
            if (authorId === currentAuthorId) {
                // If the author of the intersection is the current author
                if (sectorIntersectionAreas[authorIdKey]) {
                    Object.values(sectorIntersectionAreas[authorIdKey]).forEach(area => {
                        if (area) area.remove();
                    })
                }
                continue;
            }

            // If the intersection intersects the current author
            const sectorIntersectsCurrent = sectorIntersectionAreas[authorIdKey]?.[currentAuthorId];
            if (sectorIntersectsCurrent) {
                sectorIntersectsCurrent.remove();
                delete sectorIntersectionAreas[authorIdKey][currentAuthorId];
                if (Object.keys(sectorIntersectionAreas[authorIdKey]).length === 0) {
                    delete sectorIntersectionAreas[authorIdKey];
                }
            }
        }

        clearVar(['intersection-tL', 'intersection-tR', 'intersection-bR', 'intersection-bL'])
        
        const nonIntersectedSavedSectors: paper.Path.Arc[] = [];
        let atLeastOneIntersection = false;

        sectorArray.forEach(savedSector => {
            if (sector.id === savedSector.id) return;
            if (sector.layer.id !== savedSector.layer.id) return;

            const existingArea = sectorIntersectionAreas[sector.id]?.[savedSector.id];
            if (existingArea) {
                existingArea.remove();
                delete sectorIntersectionAreas[sector.id][savedSector.id];
            }

            if (sector.intersects(savedSector)) {
                atLeastOneIntersection = true;
                const area = sector.intersect(savedSector);
                const areaFillColor = new paper.Color('#EECD2Cad');
                area.fillColor = areaFillColor;
                
                //console.log(`tweening ${sector.id} && ${savedSector.id}`)
                sector.tween({
                    strokeColor: new paper.Color('#666')
                }, {
                    duration: 300,
                    easing: 'easeOutCubic'
                })
                savedSector.tween({
                    strokeColor: new paper.Color('#666')
                }, {
                    duration: 300,
                    easing: 'easeOutCubic'
                })
                

                writeVar('intersection-tL', area.bounds.topLeft)
                writeVar('intersection-tR', area.bounds.topRight)
                writeVar('intersection-bR', area.bounds.bottomRight)
                writeVar('intersection-bL', area.bounds.bottomLeft)

                const existingDict = sectorIntersectionAreas[sector.id];
                sectorIntersectionAreas[sector.id] = {
                    ...existingDict,
                    [savedSector.id]: area
                }
    
            } else {
                nonIntersectedSavedSectors.push(savedSector)
            }
        });

        nonIntersectedSavedSectors.forEach(savedSector => {
            

            const isIntersectedElsewhere = Object.values(sectorIntersectionAreas).some(area => {
                return area[savedSector.id] ? true : false
            })

            if (isIntersectedElsewhere || sectorIntersectionAreas[savedSector.id]) {
                //console.log(savedSector.id, ' is being intersected but not by the author.')
            } else {
                //console.log(savedSector.id, ' is not being intersected by anyone.')
                savedSector.tween({
                    fillColor: theme == 'dark' ? new paper.Color(0, 0, 0, 1) : new paper.Color(1, 1, 1, 1),
                    strokeColor: new paper.Color('#2d2d2d')
                }, {
                    duration: 300,
                    easing: 'easeOutCubic'
                })
            }
        })

        if (!atLeastOneIntersection) {
            delete sectorIntersectionAreas[sector.id];
            //console.log(`tweening ${sector.id} (author) back to normal`)
            sector.tween({
                fillColor: theme == 'dark' ? new paper.Color(0, 0, 0, 1) : new paper.Color(1, 1, 1, 1),
                strokeColor: new paper.Color('#2d2d2d ')
            }, {
                duration: 300,
                easing: 'easeOutCubic'
            })
        }
    }

    const playerCircleMouseMoveHandler = (e: any) => {
        const zoom = getZoom();
        const event: MouseEvent = e;

        const deltaX = (event.movementX * (1 / zoom));
        const deltaY =(event.movementY * (1 / zoom));

        group.position.x += deltaX;
        group.position.y += deltaY;

        sector.position.x += deltaX;
        sector.position.y += deltaY;

        savedPlayerCirclePosition.x += deltaX;
        savedPlayerCirclePosition.y += deltaY;

        savedThroughCirclePosition.x += deltaX;
        savedThroughCirclePosition.y += deltaY;

        writeVar('circle-x', savedPlayerCirclePosition.x);
        writeVar('circle-y', savedPlayerCirclePosition.y);

        checkSectorIntersections(sector.id);
    }

    playerCircleGroup.onMouseDown = () => {
        if (areHandlersDisabled()) return;
        disableHandlers();
        document.body.style.cursor = 'grabbing';

        document.addEventListener('mousemove', playerCircleMouseMoveHandler)

        playerCircle.tween({
            scaling: 1.2
        },{
            easing: 'easeOutCubic',
            duration: 200
        })

        playerCircleGroup.onMouseUp = () => {
            enableHandlers();

            playerCircle.tween({
                scaling: 1.1
            },{
                easing: 'easeOutCubic',
                duration: 200
            })

            document.removeEventListener('mousemove', playerCircleMouseMoveHandler)
            document.body.style.cursor = 'grab';

            clearVar('circle-y');
            clearVar('circle-x');
        }
    }

    const throughCircleDocumentMouseMoveHandler = (e: any) => {
        disableHandlers();
        const deltaX = (e.movementX * (1 / getZoom()));
        const deltaY =(e.movementY * (1 / getZoom()));

        savedThroughCirclePosition.x += deltaX;
        savedThroughCirclePosition.y += deltaY;

        checkSectorIntersections(sector.id);

        const pivotOrigin = savedPlayerCirclePosition;
        
        const x = savedThroughCirclePosition.x - pivotOrigin.x;
        const y = savedThroughCirclePosition.y - pivotOrigin.y;

        const targetAngleInRadians = Math.atan2(y, x);
        const targetAngleInDegrees = targetAngleInRadians * (180 / (Math.PI));

        const currentAngle = group.rotation;
        const actualTargetAngleInDegrees = targetAngleInDegrees + 90;

        const moveByAngle = (actualTargetAngleInDegrees - currentAngle);

        group.rotate(moveByAngle, pivotOrigin);
        sector.rotate(moveByAngle, pivotOrigin);
        playerNumber.rotate(-moveByAngle);// Weird

        writeVar('currentAngle', currentAngle.toFixed(2));
        writeVar('targetAngleInDegrees', actualTargetAngleInDegrees.toFixed(2));
        writeVar('moveByAngle', moveByAngle.toFixed(2));

        document.body.style.cursor = 'grabbing';
        console.log(savedThroughCirclePosition)
    }

    if (!offense) {
        group.rotate(180, savedPlayerCirclePosition);
        sector.rotate(180, savedPlayerCirclePosition);
        playerNumber.rotate(-180);// Weird

        savedThroughCirclePosition.y += 300; // RADIUS IS 300 
        console.log(savedThroughCirclePosition)
    }

    let hasMouseLeft = false;
    let isMouseDown = false;

    const throughCircleDocumentMouseUpHandler = () => {
        enableHandlers();
        if (hasMouseLeft) {
            document.body.style.cursor = 'default';

            hinterArc.tween({ opacity: 0 },{
                easing: 'easeOutCubic',
                duration: 400
            })
            arrowheadStart.tween({ opacity: 0 },{
                easing: 'easeOutCubic',
                duration: 400
            })
            arrowheadEnd.tween({ opacity: 0 },{
                easing: 'easeOutCubic',
                duration: 400
            })
        } else {
            document.body.style.cursor = 'grab';
        }
        isMouseDown = false;

        clearVar('currentAngle');
        clearVar('targetAngleInDegrees');
        clearVar('moveByAngle');

        document.removeEventListener('mousemove', throughCircleDocumentMouseMoveHandler)
        document.removeEventListener('mouseup', throughCircleDocumentMouseUpHandler)
    }

    throughCircle.onMouseLeave = () => {
        hasMouseLeft = true;
        document.body.style.cursor = 'default';

        if (!isMouseDown) {
            console.log('tweening back')
            hinterArc.tween({ opacity: 0 },{
                easing: 'easeOutCubic',
                duration: 400
            })
            arrowheadStart.tween({ opacity: 0 },{
                easing: 'easeOutCubic',
                duration: 400
            })
            arrowheadEnd.tween({ opacity: 0 },{
                easing: 'easeOutCubic',
                duration: 400
            })
        }
    }

    throughCircle.onMouseEnter = () => {
        if (areHandlersDisabled()) return;
        hasMouseLeft = false;
        document.body.style.cursor = 'grab';

        hinterArc.strokeColor = new paper.Color('gold');

        hinterArc.tween({ opacity: 1 },{
            easing: 'easeOutCubic',
            duration: 400
        })
        arrowheadStart.tween({ opacity: 1 },{
            easing: 'easeOutCubic',
            duration: 400
        })
        arrowheadEnd.tween({ opacity: 1 },{
            easing: 'easeOutCubic',
            duration: 400
        })
    }

    throughCircle.onMouseDown = () => {
        if (areHandlersDisabled()) return;
        isMouseDown = true;
        document.body.style.cursor = 'grabbing';


        document.addEventListener('mousemove', throughCircleDocumentMouseMoveHandler)
        document.addEventListener('mouseup', throughCircleDocumentMouseUpHandler)
    }

    const positionalsButton = document.querySelector('.get-positionals-button') as HTMLButtonElement;
    positionalsButton.addEventListener('click', () => {
        console.log(`group: ${group.id}`, {
            group: {
                x: group.position.x,
                y: group.position.y
            },
            sector: {
                x: sector.position.x,
                y: sector.position.y
            },
            savedCirclePosition: savedPlayerCirclePosition,
            savedThroughCirclePosition
        })
    })

    checkSectorIntersections(sector.id);

    return {
        group,
        savedPlayerCirclePosition,
        savedThroughCirclePosition
    }
}


const disableHandlers = $(() => {
    document.body.classList.add('disable-handlers');
})
const enableHandlers = $(() => {
    document.body.classList.remove('disable-handlers');
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getRandomInteger = ((min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
})

/* const removePlayer = $((playerItems: paper.Item[]) => {
    const trashLayer = paper.project.layers.find(layer => layer.name == 'trash');
    trashLayer?.addChildren(playerItems);
})  */

const findLayer = $((layerName: string) => {
    const found = paper.project.layers.find(layer => layer.name === layerName);
    return found;
})
const findItemByName = $((name: string) => {
    const found = paper.project.activeLayer.children.find(item => item.name === name);
    return found;
})

const willBeOutsideBounds = $(async (deltaX: number, deltaY: number) => {
    const fieldLayer = await findLayer('field');
    const field = fieldLayer?.children[0];


    if (field) {
        const fieldScale = Math.round(field.scaling.x * 20) / 20; 
        const padding = 150 * fieldScale; 
        console.log({deltaX, deltaY})

        if (deltaY) {
            if (field.bounds.top + padding > paper.view.bounds.bottom + (deltaY * 4)) {
                return true;
            }
            if (field.bounds.bottom - padding  < paper.view.bounds.top + (deltaY * 4)) {
                return true;
            }
        }

        if (deltaX) {
            if (field.bounds.left + padding > paper.view.bounds.right + (deltaX * 4 )) {
                return true;
            }
            if (field.bounds.right - padding < paper.view.bounds.left + (deltaX * 4)) {
                return true;
            }
        }
    }

    return false;
})
interface DrawPlayerProps {
    point: paper.Point,
    radius: number,
    sectorAngle: number,
    offense: boolean,
    index: number,
    theme: 'dark' | 'light'
}

export default component$(() => {

    type PlayerGroupStore = { [index: number]: NoSerialize<paper.Group> }

    const currentPlayerStore = useStore({
        playerGroups: {} as PlayerGroupStore
    })

    const drawPlayer = $((props: DrawPlayerProps) => {
        const { point, radius, offense, index, theme } = props;
    
        // Create the circle
        const circle = new paper.Path.Circle(point, radius);
        circle.applyMatrix = false; // Enables animations
    
        if (offense) { // if the player is offense
            circle.fillColor = new paper.Color(255 / 255, 255 / 255, 255 / 255, 1);
        } else {
            circle.fillColor = new paper.Color('#1d1d1d');
        }

        if (theme == 'light' && offense) {
            circle.strokeColor = new paper.Color('#1d1d1d');
        }
        
        // Create Player Group
        const playerGroup = new paper.Group([circle]);
        playerGroup.applyMatrix = false; 
        playerGroup.name = 'p-group';
    
        // Define sector options
        const sectorRadius = 90;

        currentPlayerStore.playerGroups[index] = noSerialize(playerGroup);
    
        return drawSectorFieldOnCircle({
            circle,
            sectorRadius,
            group: playerGroup,
            ...props
        })
    })

    const offenseSectorAngle = useSignal(90);
    const defenseSectorAngle = useSignal(60);

    const zoom = useSignal(0.8);
    const playerCount = useSignal(0);

    const theme = useSignal<'light' | 'dark'>('light');

    const addOffensePlayer = $(async (initialPoint?: paper.Point) => {

        const pData = drawPlayer({
            point: initialPoint || paper.view.center,
            radius: 30,
            sectorAngle: offenseSectorAngle.value,
            offense: true,
            index: playerCount.value,
            theme: theme.value
        })
        playerCount.value++;

        return pData;
    })
    const addDefensePlayer = $(async (initialPoint?: paper.Point) => {

        const pData = drawPlayer({
            point: initialPoint || paper.view.center,
            radius: 30,
            sectorAngle: defenseSectorAngle.value,
            offense: false,
            index: playerCount.value,
            theme: theme.value
        })
        playerCount.value++;

        return pData;
    })

    const organizePlayersHandler = $(() => {
        currentPlayerStore
    })

    const clearPlayersHandler = $(() => {
        paper.project.activeLayer.remove();

        const freshLayer = new paper.Layer()
        paper.project.addLayer(freshLayer);
        freshLayer.activate();

        playerCount.value = 0;
    })

    const exportCanvasImage = $(async () => {
        disableHandlers();
        const fieldLayer = await findLayer('field');
        const field = fieldLayer?.children[0];
        
        field?.children.forEach(fieldItem => {
            if (fieldItem.name === 'field-label') {
                fieldItem.visible = false;
            }
        })

        const originalCenter = paper.view.center;
        const originalSize = {
            height: paper.view.viewSize.height,
            width: paper.view.viewSize.width
        }

        const throughCircles: paper.Item[] = [];

        paper.project.activeLayer.children.forEach(child => {
            if (child.name === 'p-group') {
                const playerGroup = child;
                const throughCircle = playerGroup.children.find(groupItem => {
                    return groupItem.name === 't-circle';
                })

                if (throughCircle) {
                    throughCircle.visible = false;
                    throughCircles.push(throughCircle);
                }
            }
        })

        if (field) {
            paper.view.scale(1.5);
            paper.view.update();

            const exportWrap = document.querySelector('.canvas-wrap') as HTMLElement;
            exportWrap.setAttribute('export', 'high');

            const exportSize = {
                height: field.bounds.height,
                width: (field.bounds.height * 0.846)
            }

            exportWrap.style.height = exportSize.height + 'px';
            exportWrap.style.width = exportSize.width + 'px';

            paper.view.viewSize.height = exportSize.height;
            paper.view.viewSize.width = exportSize.width;

            paper.view.center = field.bounds.center
            paper.view.zoom = 1;

            const mark = await findItemByName('mark') as paper.PointText;
            mark.scale(1 / mark.scaling.x);
            mark.scale(field.scaling.x);
            const markPoint = field.bounds.topCenter.add(new paper.Point(0, 80 * field.scaling.x));
            mark!.position = markPoint; 
            mark!.visible = true;

            console.log(field.bounds.height)
            
            paper.view.update();

            paper.view.element.toBlob((blob) => {
                const exportWrap = document.querySelector('.export-wrap') as HTMLElement;
                exportWrap.classList.add('export');

                const downloadButton = exportWrap.querySelector('.download') as HTMLAnchorElement
            
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    console.log(                    blob.type)
                    const bgElement = document.querySelector('.download-image-background') as HTMLImageElement;
                    bgElement.src = url;
                    downloadButton.href = url;
                    downloadButton.download = 'example';
                }
            }) 

            paper.view.scale(1 / 1.5);
            paper.view.update();
            
            mark!.visible = false;

            exportWrap.removeAttribute('export');

            exportWrap.style.removeProperty('height');
            exportWrap.style.removeProperty('width');
            paper.view.viewSize.height = originalSize.height;
            paper.view.viewSize.width = originalSize.width;

            paper.view.zoom = zoom.value;
            paper.view.center = originalCenter; 
            paper.view.update(); 

            throughCircles.forEach(circle => {
                circle.visible = true;
            })

            field?.children.forEach(fieldItem => {
                if (fieldItem.name === 'field-label') {
                    fieldItem.visible = true;
                }
            })
        }

        enableHandlers();
    })

    const fieldScale = useSignal(2);

    const fieldScaleRangeInputHandler = $(async (e: any) => {
        const lastScale = fieldScale.value;

        const fieldLayer = await findLayer('field');
        const field = fieldLayer?.children[0];

        if (field) {
            field.scale(1 / lastScale);
            field.scale(e.target.value);
            paper.view.center = field.bounds.center;
        }

        fieldScale.value = e.target.value;
    })

    const downloadExportModal = $(() => {
        //e.target.classList.add('downloading');
    })

    useVisibleTask$(async () => {
        document.body.style.overflow = 'hidden';
        document.body.setAttribute('theme', theme.value)

        const downloadButton = document.querySelector('.download-image-wrap .download') as HTMLAnchorElement
        downloadButton.addEventListener('click', downloadExportModal)

        try {
            const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
            if (canvas) {
                paper.setup(canvas);
                paper.view.zoom = zoom.value;

                const trashLayer = new paper.Layer();
                trashLayer.name = 'trash';

                const fieldLayer = new paper.Layer();
                fieldLayer.name = 'field';
                paper.project.addLayer(fieldLayer);
                fieldLayer.activate();

                paper.view.onResize = (e: any) => {
                    paper.view.translate(new paper.Point(e.delta.width / 2, 0))
                }

                const field = paper.project.importSVG(`
                <svg width="895" height="1186" viewBox="0 0 895 1186" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="895" height="1186" fill="${theme.value == 'dark' ? 'black' : 'white'}"/>
                <circle cx="447.046" cy="713.046" r="13.1747" transform="rotate(45 447.046 713.046)" stroke="${theme.value == 'dark' ? '#343434' : '#D2D2D2'}" stroke-width="1"/>
                <line x1="436.899" y1="703.146" x2="455.991" y2="722.238" stroke="${theme.value == 'dark' ? '#343434' : '#D2D2D2'}" stroke-width="1"/>
                <line x1="455.991" y1="703.854" x2="436.899" y2="722.945" stroke="${theme.value == 'dark' ? '#343434' : '#D2D2D2'}" stroke-width="1"/>
                <circle cx="447.046" cy="471.046" r="13.1747" transform="rotate(45 447.046 471.046)" stroke="${theme.value == 'dark' ? '#343434' : '#D2D2D2'}" stroke-width="1"/>
                <line x1="436.899" y1="461.146" x2="455.991" y2="480.238" stroke="${theme.value == 'dark' ? '#343434' : '#D2D2D2'}" stroke-width="1"/>
                <line x1="455.991" y1="461.854" x2="436.899" y2="480.945" stroke="${theme.value == 'dark' ? '#343434' : '#D2D2D2'}" stroke-width="1"/>
                <rect x="771" y="76" width="1033" height="658" transform="rotate(90 771 76)" stroke="${theme.value == 'dark' ? '#343434' : '#D2D2D2'}" stroke-width="1"/>
                <path id="field-label" d="M44.4 1021H37.344V1009.43H44.4V1010.87H38.192L38.912 1010.25V1014.49H43.856V1015.88H38.912V1020.2L38.192 1019.54H44.4V1021ZM47.9201 1021H46.4161V1013.18H47.7761L47.9361 1014.38C48.1815 1013.93 48.5335 1013.58 48.9921 1013.34C49.4615 1013.08 49.9735 1012.95 50.5281 1012.95C51.5521 1012.95 52.3095 1013.25 52.8001 1013.83C53.2908 1014.42 53.5361 1015.21 53.5361 1016.22V1021H52.0321V1016.55C52.0321 1015.76 51.8615 1015.2 51.5201 1014.86C51.1788 1014.5 50.7201 1014.33 50.1441 1014.33C49.4401 1014.33 48.8908 1014.56 48.4961 1015.02C48.1121 1015.47 47.9201 1016.09 47.9201 1016.86V1021ZM58.7552 1021.19C57.9979 1021.19 57.3473 1021.02 56.8033 1020.68C56.2593 1020.33 55.8379 1019.84 55.5393 1019.22C55.2513 1018.61 55.1073 1017.9 55.1073 1017.11C55.1073 1016.31 55.2566 1015.6 55.5553 1014.98C55.8539 1014.35 56.2806 1013.86 56.8353 1013.5C57.3899 1013.13 58.0513 1012.95 58.8193 1012.95C59.4273 1012.95 59.9659 1013.08 60.4353 1013.34C60.9153 1013.58 61.2886 1013.95 61.5553 1014.44V1009.22H63.0433V1021H61.6993L61.5713 1019.58C61.3153 1020.1 60.9366 1020.5 60.4353 1020.78C59.9446 1021.05 59.3846 1021.19 58.7552 1021.19ZM59.0593 1019.83C59.5713 1019.83 60.0086 1019.71 60.3713 1019.48C60.7446 1019.25 61.0326 1018.92 61.2353 1018.5C61.4379 1018.09 61.5393 1017.61 61.5393 1017.06C61.5393 1016.52 61.4379 1016.05 61.2353 1015.64C61.0326 1015.22 60.7446 1014.9 60.3713 1014.66C60.0086 1014.43 59.5713 1014.31 59.0593 1014.31C58.5473 1014.31 58.1099 1014.43 57.7473 1014.68C57.3846 1014.91 57.1073 1015.24 56.9153 1015.66C56.7233 1016.06 56.6273 1016.53 56.6273 1017.06C56.6273 1017.61 56.7233 1018.09 56.9153 1018.5C57.1073 1018.92 57.3846 1019.25 57.7473 1019.48C58.1099 1019.71 58.5473 1019.83 59.0593 1019.83ZM70.829 1021H64.733V1019.78L68.957 1014.44H64.733V1013.18H70.829V1014.41L66.573 1019.74H70.829V1021ZM71.8416 1017.08C71.8416 1016.28 72.0176 1015.57 72.3696 1014.95C72.7216 1014.33 73.2016 1013.85 73.8096 1013.5C74.4283 1013.14 75.1323 1012.97 75.9216 1012.97C76.711 1012.97 77.4096 1013.14 78.0176 1013.5C78.6256 1013.85 79.1056 1014.33 79.4576 1014.95C79.8096 1015.57 79.9856 1016.28 79.9856 1017.08C79.9856 1017.88 79.8096 1018.59 79.4576 1019.21C79.1056 1019.83 78.6256 1020.31 78.0176 1020.66C77.4096 1021.02 76.711 1021.19 75.9216 1021.19C75.1323 1021.19 74.4283 1021.02 73.8096 1020.66C73.2016 1020.31 72.7216 1019.83 72.3696 1019.21C72.0176 1018.59 71.8416 1017.88 71.8416 1017.08ZM73.3616 1017.08C73.3616 1017.62 73.4683 1018.1 73.6816 1018.52C73.9056 1018.94 74.2096 1019.26 74.5936 1019.5C74.9776 1019.73 75.4203 1019.85 75.9216 1019.85C76.423 1019.85 76.8656 1019.73 77.2496 1019.5C77.6336 1019.26 77.9323 1018.94 78.1456 1018.52C78.3696 1018.1 78.4816 1017.62 78.4816 1017.08C78.4816 1016.53 78.3696 1016.05 78.1456 1015.64C77.9323 1015.22 77.6336 1014.9 77.2496 1014.66C76.8656 1014.43 76.423 1014.31 75.9216 1014.31C75.4203 1014.31 74.9776 1014.43 74.5936 1014.66C74.2096 1014.9 73.9056 1015.22 73.6816 1015.64C73.4683 1016.05 73.3616 1016.53 73.3616 1017.08ZM83.1545 1021H81.6505V1013.18H83.0105L83.1705 1014.38C83.4158 1013.93 83.7678 1013.58 84.2265 1013.34C84.6958 1013.08 85.2078 1012.95 85.7625 1012.95C86.7865 1012.95 87.5438 1013.25 88.0345 1013.83C88.5252 1014.42 88.7705 1015.21 88.7705 1016.22V1021H87.2665V1016.55C87.2665 1015.76 87.0958 1015.2 86.7545 1014.86C86.4132 1014.5 85.9545 1014.33 85.3785 1014.33C84.6745 1014.33 84.1252 1014.56 83.7305 1015.02C83.3465 1015.47 83.1545 1016.09 83.1545 1016.86V1021ZM94.2296 1021.19C93.4723 1021.19 92.8003 1021.02 92.2136 1020.68C91.627 1020.33 91.1683 1019.85 90.8376 1019.24C90.507 1018.62 90.3416 1017.91 90.3416 1017.1C90.3416 1016.27 90.5016 1015.55 90.8216 1014.94C91.1523 1014.32 91.6003 1013.83 92.1656 1013.48C92.7416 1013.13 93.4083 1012.95 94.1656 1012.95C94.9123 1012.95 95.5576 1013.11 96.1016 1013.43C96.6563 1013.75 97.083 1014.2 97.3816 1014.78C97.691 1015.35 97.8456 1016.03 97.8456 1016.81V1017.37L91.1416 1017.38L91.1736 1016.38H96.3416C96.3416 1015.73 96.1443 1015.2 95.7496 1014.81C95.355 1014.41 94.827 1014.22 94.1656 1014.22C93.6643 1014.22 93.2323 1014.33 92.8696 1014.55C92.5176 1014.77 92.2456 1015.09 92.0536 1015.51C91.8723 1015.93 91.7816 1016.43 91.7816 1017.02C91.7816 1017.95 91.995 1018.68 92.4216 1019.19C92.8483 1019.69 93.4616 1019.94 94.2616 1019.94C94.8483 1019.94 95.3283 1019.83 95.7016 1019.59C96.075 1019.36 96.3256 1019.02 96.4536 1018.57H97.8616C97.6696 1019.4 97.259 1020.05 96.6296 1020.5C96.0003 1020.96 95.2003 1021.19 94.2296 1021.19Z" fill="${theme.value == 'dark' ? '#EFEFEF' : '#000000'}"/>
                <path id="field-label" d="M63.912 707.432V719H62.344V707.432H63.912ZM66.888 713.896H63.48V712.536H66.76C67.4107 712.536 67.912 712.371 68.264 712.04C68.616 711.709 68.792 711.24 68.792 710.632C68.792 710.056 68.6053 709.613 68.232 709.304C67.8693 708.984 67.3467 708.824 66.664 708.824H63.208V707.432H66.76C67.8907 707.432 68.776 707.704 69.416 708.248C70.0667 708.792 70.392 709.539 70.392 710.488C70.392 711.203 70.216 711.8 69.864 712.28C69.5227 712.749 69.016 713.091 68.344 713.304V713.096C69.0907 713.277 69.6507 713.608 70.024 714.088C70.408 714.557 70.6 715.165 70.6 715.912C70.6 716.552 70.4507 717.107 70.152 717.576C69.864 718.035 69.4427 718.387 68.888 718.632C68.3333 718.877 67.6773 719 66.92 719H63.208V717.608H66.888C67.56 717.608 68.0773 717.443 68.44 717.112C68.8027 716.781 68.984 716.317 68.984 715.72C68.984 715.144 68.7973 714.696 68.424 714.376C68.0613 714.056 67.5493 713.896 66.888 713.896ZM76.7868 711.112V712.488H76.1148C75.4001 712.488 74.8348 712.696 74.4188 713.112C74.0134 713.517 73.8108 714.099 73.8108 714.856V719H72.3068V711.192H73.7148L73.8428 712.76H73.6988C73.8054 712.248 74.0614 711.832 74.4668 711.512C74.8721 711.181 75.3788 711.016 75.9868 711.016C76.1254 711.016 76.2534 711.027 76.3708 711.048C76.4988 711.059 76.6374 711.08 76.7868 711.112ZM78.1974 719V711.176H79.7014V719H78.1974ZM78.9334 709.32C78.6667 709.32 78.432 709.224 78.2294 709.032C78.0374 708.829 77.9414 708.595 77.9414 708.328C77.9414 708.051 78.0374 707.816 78.2294 707.624C78.432 707.432 78.6667 707.336 78.9334 707.336C79.2107 707.336 79.4454 707.432 79.6374 707.624C79.8294 707.816 79.9254 708.051 79.9254 708.328C79.9254 708.595 79.8294 708.829 79.6374 709.032C79.4454 709.224 79.2107 709.32 78.9334 709.32ZM81.3729 715.096C81.3729 714.275 81.5329 713.555 81.8529 712.936C82.1835 712.317 82.6369 711.832 83.2129 711.48C83.7889 711.128 84.4555 710.952 85.2129 710.952C86.1942 710.952 87.0102 711.213 87.6609 711.736C88.3115 712.259 88.7009 712.952 88.8289 713.816H87.3249C87.1969 713.315 86.9462 712.936 86.5729 712.68C86.1995 712.424 85.7622 712.296 85.2609 712.296C84.7915 712.296 84.3755 712.413 84.0129 712.648C83.6502 712.872 83.3675 713.192 83.1649 713.608C82.9622 714.024 82.8609 714.515 82.8609 715.08C82.8609 715.645 82.9569 716.136 83.1489 716.552C83.3409 716.957 83.6129 717.277 83.9649 717.512C84.3169 717.736 84.7275 717.848 85.1969 717.848C85.7302 717.848 86.1889 717.715 86.5729 717.448C86.9569 717.181 87.2129 716.819 87.3409 716.36H88.8449C88.7489 716.925 88.5302 717.421 88.1889 717.848C87.8582 718.264 87.4315 718.595 86.9089 718.84C86.3969 719.075 85.8262 719.192 85.1969 719.192C84.4289 719.192 83.7569 719.021 83.1809 718.68C82.6155 718.339 82.1729 717.864 81.8529 717.256C81.5329 716.637 81.3729 715.917 81.3729 715.096ZM91.9678 719H90.4638V707.224H91.9678V714.856L95.4398 711.176H97.3278L94.3358 714.296L97.3118 719H95.5838L93.2958 715.384L91.9678 716.776V719Z" fill="${theme.value == 'dark' ? '#EFEFEF' : '#000000'}"/>
                <path id="field-label" d="M63.912 465.432V477H62.344V465.432H63.912ZM66.888 471.896H63.48V470.536H66.76C67.4107 470.536 67.912 470.371 68.264 470.04C68.616 469.709 68.792 469.24 68.792 468.632C68.792 468.056 68.6053 467.613 68.232 467.304C67.8693 466.984 67.3467 466.824 66.664 466.824H63.208V465.432H66.76C67.8907 465.432 68.776 465.704 69.416 466.248C70.0667 466.792 70.392 467.539 70.392 468.488C70.392 469.203 70.216 469.8 69.864 470.28C69.5227 470.749 69.016 471.091 68.344 471.304V471.096C69.0907 471.277 69.6507 471.608 70.024 472.088C70.408 472.557 70.6 473.165 70.6 473.912C70.6 474.552 70.4507 475.107 70.152 475.576C69.864 476.035 69.4427 476.387 68.888 476.632C68.3333 476.877 67.6773 477 66.92 477H63.208V475.608H66.888C67.56 475.608 68.0773 475.443 68.44 475.112C68.8027 474.781 68.984 474.317 68.984 473.72C68.984 473.144 68.7973 472.696 68.424 472.376C68.0613 472.056 67.5493 471.896 66.888 471.896ZM76.7868 469.112V470.488H76.1148C75.4001 470.488 74.8348 470.696 74.4188 471.112C74.0134 471.517 73.8108 472.099 73.8108 472.856V477H72.3068V469.192H73.7148L73.8428 470.76H73.6988C73.8054 470.248 74.0614 469.832 74.4668 469.512C74.8721 469.181 75.3788 469.016 75.9868 469.016C76.1254 469.016 76.2534 469.027 76.3708 469.048C76.4988 469.059 76.6374 469.08 76.7868 469.112ZM78.1974 477V469.176H79.7014V477H78.1974ZM78.9334 467.32C78.6667 467.32 78.432 467.224 78.2294 467.032C78.0374 466.829 77.9414 466.595 77.9414 466.328C77.9414 466.051 78.0374 465.816 78.2294 465.624C78.432 465.432 78.6667 465.336 78.9334 465.336C79.2107 465.336 79.4454 465.432 79.6374 465.624C79.8294 465.816 79.9254 466.051 79.9254 466.328C79.9254 466.595 79.8294 466.829 79.6374 467.032C79.4454 467.224 79.2107 467.32 78.9334 467.32ZM81.3729 473.096C81.3729 472.275 81.5329 471.555 81.8529 470.936C82.1835 470.317 82.6369 469.832 83.2129 469.48C83.7889 469.128 84.4555 468.952 85.2129 468.952C86.1942 468.952 87.0102 469.213 87.6609 469.736C88.3115 470.259 88.7009 470.952 88.8289 471.816H87.3249C87.1969 471.315 86.9462 470.936 86.5729 470.68C86.1995 470.424 85.7622 470.296 85.2609 470.296C84.7915 470.296 84.3755 470.413 84.0129 470.648C83.6502 470.872 83.3675 471.192 83.1649 471.608C82.9622 472.024 82.8609 472.515 82.8609 473.08C82.8609 473.645 82.9569 474.136 83.1489 474.552C83.3409 474.957 83.6129 475.277 83.9649 475.512C84.3169 475.736 84.7275 475.848 85.1969 475.848C85.7302 475.848 86.1889 475.715 86.5729 475.448C86.9569 475.181 87.2129 474.819 87.3409 474.36H88.8449C88.7489 474.925 88.5302 475.421 88.1889 475.848C87.8582 476.264 87.4315 476.595 86.9089 476.84C86.3969 477.075 85.8262 477.192 85.1969 477.192C84.4289 477.192 83.7569 477.021 83.1809 476.68C82.6155 476.339 82.1729 475.864 81.8529 475.256C81.5329 474.637 81.3729 473.917 81.3729 473.096ZM91.9678 477H90.4638V465.224H91.9678V472.856L95.4398 469.176H97.3278L94.3358 472.296L97.3118 477H95.5838L93.2958 473.384L91.9678 474.776V477Z" fill="${theme.value == 'dark' ? '#EFEFEF' : '#000000'}"/>
                <path id="field-label" d="M43.4 177H36.344V165.432H43.4V166.872H37.192L37.912 166.248V170.488H42.856V171.88H37.912V176.2L37.192 175.544H43.4V177ZM46.9201 177H45.4161V169.176H46.7761L46.9361 170.376C47.1815 169.928 47.5335 169.581 47.9921 169.336C48.4615 169.08 48.9735 168.952 49.5281 168.952C50.5521 168.952 51.3095 169.245 51.8001 169.832C52.2908 170.419 52.5361 171.213 52.5361 172.216V177H51.0321V172.552C51.0321 171.763 50.8615 171.197 50.5201 170.856C50.1788 170.504 49.7201 170.328 49.1441 170.328C48.4401 170.328 47.8908 170.557 47.4961 171.016C47.1121 171.475 46.9201 172.088 46.9201 172.856V177ZM57.7552 177.192C56.9979 177.192 56.3473 177.021 55.8033 176.68C55.2593 176.328 54.8379 175.843 54.5393 175.224C54.2513 174.605 54.1073 173.901 54.1073 173.112C54.1073 172.312 54.2566 171.603 54.5553 170.984C54.8539 170.355 55.2806 169.859 55.8353 169.496C56.3899 169.133 57.0513 168.952 57.8193 168.952C58.4273 168.952 58.9659 169.08 59.4353 169.336C59.9153 169.581 60.2886 169.949 60.5553 170.44V165.224H62.0433V177H60.6993L60.5713 175.576C60.3153 176.099 59.9366 176.499 59.4353 176.776C58.9446 177.053 58.3846 177.192 57.7552 177.192ZM58.0593 175.832C58.5713 175.832 59.0086 175.715 59.3713 175.48C59.7446 175.245 60.0326 174.92 60.2353 174.504C60.4379 174.088 60.5393 173.608 60.5393 173.064C60.5393 172.52 60.4379 172.045 60.2353 171.64C60.0326 171.224 59.7446 170.899 59.3713 170.664C59.0086 170.429 58.5713 170.312 58.0593 170.312C57.5473 170.312 57.1099 170.435 56.7473 170.68C56.3846 170.915 56.1073 171.24 55.9153 171.656C55.7233 172.061 55.6273 172.531 55.6273 173.064C55.6273 173.608 55.7233 174.088 55.9153 174.504C56.1073 174.92 56.3846 175.245 56.7473 175.48C57.1099 175.715 57.5473 175.832 58.0593 175.832ZM69.829 177H63.733V175.784L67.957 170.44H63.733V169.176H69.829V170.408L65.573 175.736H69.829V177ZM70.8416 173.08C70.8416 172.28 71.0176 171.571 71.3696 170.952C71.7216 170.333 72.2016 169.848 72.8096 169.496C73.4283 169.144 74.1323 168.968 74.9216 168.968C75.711 168.968 76.4096 169.144 77.0176 169.496C77.6256 169.848 78.1056 170.333 78.4576 170.952C78.8096 171.571 78.9856 172.28 78.9856 173.08C78.9856 173.88 78.8096 174.589 78.4576 175.208C78.1056 175.827 77.6256 176.312 77.0176 176.664C76.4096 177.016 75.711 177.192 74.9216 177.192C74.1323 177.192 73.4283 177.016 72.8096 176.664C72.2016 176.312 71.7216 175.827 71.3696 175.208C71.0176 174.589 70.8416 173.88 70.8416 173.08ZM72.3616 173.08C72.3616 173.624 72.4683 174.104 72.6816 174.52C72.9056 174.936 73.2096 175.261 73.5936 175.496C73.9776 175.731 74.4203 175.848 74.9216 175.848C75.423 175.848 75.8656 175.731 76.2496 175.496C76.6336 175.261 76.9323 174.936 77.1456 174.52C77.3696 174.104 77.4816 173.624 77.4816 173.08C77.4816 172.525 77.3696 172.045 77.1456 171.64C76.9323 171.224 76.6336 170.899 76.2496 170.664C75.8656 170.429 75.423 170.312 74.9216 170.312C74.4203 170.312 73.9776 170.429 73.5936 170.664C73.2096 170.899 72.9056 171.224 72.6816 171.64C72.4683 172.045 72.3616 172.525 72.3616 173.08ZM82.1545 177H80.6505V169.176H82.0105L82.1705 170.376C82.4158 169.928 82.7678 169.581 83.2265 169.336C83.6958 169.08 84.2078 168.952 84.7625 168.952C85.7865 168.952 86.5438 169.245 87.0345 169.832C87.5252 170.419 87.7705 171.213 87.7705 172.216V177H86.2665V172.552C86.2665 171.763 86.0958 171.197 85.7545 170.856C85.4132 170.504 84.9545 170.328 84.3785 170.328C83.6745 170.328 83.1252 170.557 82.7305 171.016C82.3465 171.475 82.1545 172.088 82.1545 172.856V177ZM93.2296 177.192C92.4723 177.192 91.8003 177.021 91.2136 176.68C90.627 176.328 90.1683 175.848 89.8376 175.24C89.507 174.621 89.3416 173.907 89.3416 173.096C89.3416 172.275 89.5016 171.555 89.8216 170.936C90.1523 170.317 90.6003 169.832 91.1656 169.48C91.7416 169.128 92.4083 168.952 93.1656 168.952C93.9123 168.952 94.5576 169.112 95.1016 169.432C95.6563 169.752 96.083 170.2 96.3816 170.776C96.691 171.352 96.8456 172.029 96.8456 172.808V173.368L90.1416 173.384L90.1736 172.376H95.3416C95.3416 171.725 95.1443 171.203 94.7496 170.808C94.355 170.413 93.827 170.216 93.1656 170.216C92.6643 170.216 92.2323 170.328 91.8696 170.552C91.5176 170.765 91.2456 171.085 91.0536 171.512C90.8723 171.928 90.7816 172.429 90.7816 173.016C90.7816 173.955 90.995 174.68 91.4216 175.192C91.8483 175.693 92.4616 175.944 93.2616 175.944C93.8483 175.944 94.3283 175.827 94.7016 175.592C95.075 175.357 95.3256 175.016 95.4536 174.568H96.8616C96.6696 175.4 96.259 176.045 95.6296 176.504C95.0003 176.963 94.2003 177.192 93.2296 177.192Z" fill="${theme.value == 'dark' ? '#EFEFEF' : '#000000'}"/>
                <line x1="114" y1="263" x2="770" y2="263" stroke="${theme.value == 'dark' ? '#343434' : '#D2D2D2'}" stroke-width="1"/>
                <line x1="114" y1="920" x2="770" y2="920" stroke="${theme.value == 'dark' ? '#343434' : '#D2D2D2'}" stroke-width="1"/>
                </svg>                                                            
                `)

                field.position = paper.view.center;
                field.scale(fieldScale.value);
                field.applyMatrix = false;

                const everythingElseLayer = new paper.Layer()
                paper.project.addLayer(everythingElseLayer);
                everythingElseLayer.activate();

                const mark = paper.project.importSVG(`
                <svg width="296" height="25" viewBox="0 0 296 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.824 0.863998V24H0.688V0.863998H3.824ZM14.64 3.744H0.912V0.863998H14.64V3.744ZM12.912 14.176H0.848V11.328H12.912V14.176ZM32.134 24H28.998V0.863998H37.734C40.2087 0.863998 42.1393 1.48267 43.526 2.72C44.934 3.936 45.638 5.632 45.638 7.808C45.638 9.408 45.2433 10.7627 44.454 11.872C43.686 12.9813 42.5873 13.7707 41.158 14.24L45.862 24H42.374L38.054 14.848H32.134V24ZM32.134 3.68V12.064H37.766C39.2167 12.064 40.3367 11.6907 41.126 10.944C41.9367 10.1973 42.342 9.16267 42.342 7.84C42.342 6.496 41.926 5.472 41.094 4.768C40.2833 4.04267 39.1633 3.68 37.734 3.68H32.134ZM81.2658 12.416C81.2658 14.7627 80.7858 16.8427 79.8258 18.656C78.8871 20.448 77.5751 21.856 75.8898 22.88C74.2258 23.8827 72.2951 24.384 70.0978 24.384C67.9431 24.384 66.0231 23.8827 64.3378 22.88C62.6738 21.856 61.3724 20.448 60.4338 18.656C59.4951 16.864 59.0258 14.784 59.0258 12.416C59.0258 10.0693 59.4951 8 60.4338 6.208C61.3938 4.416 62.7058 3.008 64.3698 1.984C66.0338 0.959998 67.9538 0.447998 70.1298 0.447998C72.3271 0.447998 74.2578 0.959998 75.9218 1.984C77.5858 3.008 78.8871 4.416 79.8258 6.208C80.7858 8 81.2658 10.0693 81.2658 12.416ZM77.9698 12.416C77.9698 10.624 77.6391 9.056 76.9778 7.712C76.3378 6.368 75.4311 5.33333 74.2578 4.608C73.0844 3.86133 71.7084 3.488 70.1298 3.488C68.5724 3.488 67.2071 3.86133 66.0338 4.608C64.8604 5.33333 63.9431 6.368 63.2818 7.712C62.6418 9.056 62.3218 10.624 62.3218 12.416C62.3218 14.208 62.6418 15.776 63.2818 17.12C63.9431 18.464 64.8604 19.5093 66.0338 20.256C67.2071 21.0027 68.5724 21.376 70.1298 21.376C71.7084 21.376 73.0844 21.0027 74.2578 20.256C75.4311 19.488 76.3378 18.432 76.9778 17.088C77.6391 15.744 77.9698 14.1867 77.9698 12.416ZM98.9728 24H95.8368V0.863998H98.9728L111.677 20.064H110.813V0.863998H113.949V24H110.813L98.1088 4.8H98.9728V24ZM137.769 2.304V24H134.633V2.304H137.769ZM127.657 3.744V0.863998H144.713V3.744H127.657ZM187.336 24.352C185.138 24.352 183.218 23.8613 181.576 22.88C179.933 21.8773 178.653 20.4907 177.736 18.72C176.818 16.928 176.36 14.8373 176.36 12.448C176.36 10.0587 176.829 7.968 177.768 6.176C178.706 4.384 180.008 2.98667 181.672 1.984C183.357 0.981333 185.298 0.48 187.496 0.48C189.245 0.48 190.824 0.810666 192.232 1.472C193.64 2.112 194.813 3.01867 195.752 4.192C196.69 5.36533 197.298 6.74133 197.576 8.32H194.216C193.789 6.80533 192.968 5.62133 191.752 4.768C190.536 3.91467 189.085 3.488 187.4 3.488C185.842 3.488 184.477 3.86133 183.304 4.608C182.152 5.33333 181.256 6.368 180.616 7.712C179.976 9.03467 179.656 10.6027 179.656 12.416C179.656 14.208 179.976 15.776 180.616 17.12C181.256 18.464 182.162 19.5093 183.336 20.256C184.509 20.9813 185.864 21.344 187.4 21.344C189.106 21.344 190.578 20.928 191.816 20.096C193.074 19.2427 193.917 18.1013 194.344 16.672H197.672C197.352 18.208 196.701 19.552 195.72 20.704C194.76 21.856 193.554 22.752 192.104 23.392C190.674 24.032 189.085 24.352 187.336 24.352ZM232.941 12.416C232.941 14.7627 232.461 16.8427 231.501 18.656C230.562 20.448 229.25 21.856 227.565 22.88C225.901 23.8827 223.97 24.384 221.773 24.384C219.618 24.384 217.698 23.8827 216.013 22.88C214.349 21.856 213.047 20.448 212.109 18.656C211.17 16.864 210.701 14.784 210.701 12.416C210.701 10.0693 211.17 8 212.109 6.208C213.069 4.416 214.381 3.008 216.045 1.984C217.709 0.959998 219.629 0.447998 221.805 0.447998C224.002 0.447998 225.933 0.959998 227.597 1.984C229.261 3.008 230.562 4.416 231.501 6.208C232.461 8 232.941 10.0693 232.941 12.416ZM229.645 12.416C229.645 10.624 229.314 9.056 228.653 7.712C228.013 6.368 227.106 5.33333 225.933 4.608C224.759 3.86133 223.383 3.488 221.805 3.488C220.247 3.488 218.882 3.86133 217.709 4.608C216.535 5.33333 215.618 6.368 214.957 7.712C214.317 9.056 213.997 10.624 213.997 12.416C213.997 14.208 214.317 15.776 214.957 17.12C215.618 18.464 216.535 19.5093 217.709 20.256C218.882 21.0027 220.247 21.376 221.805 21.376C223.383 21.376 224.759 21.0027 225.933 20.256C227.106 19.488 228.013 18.432 228.653 17.088C229.314 15.744 229.645 14.1867 229.645 12.416ZM250.648 24H247.512V0.863998H250.648L263.352 20.064H262.488V0.863998H265.624V24H262.488L249.784 4.8H250.648V24ZM295.684 24H281.572V0.863998H295.684V3.744H283.268L284.708 2.496V10.976H294.596V13.76H284.708V22.4L283.268 21.088H295.684V24Z" fill="black"/>
                </svg>
                `)
                mark.visible = false;
                mark.name = 'mark';
                mark.applyMatrix = false;

                const initial = field.bounds.center;

                await addOffensePlayer(initial.add(new paper.Point(0, 400)))
                addDefensePlayer(initial.subtract(new paper.Point(0, 400)))
            }
        } catch (error) {
            console.error(error)
        } 


        const plainWheelHandler = async (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                e.stopPropagation();
                if (paper.view) {
                    if (e.deltaY < 0) {
                        if (zoom.value > 2) return;
                        zoom.value += 0.1;
                    } else {
                        if (zoom.value < 0.5) return;
                        zoom.value -= 0.1;
                    }
                }
            } else {
                if (paper.view) {
                    const deltaX = e.shiftKey ? -e.deltaY : 0;
                    const deltaY = e.shiftKey ? 0 : -e.deltaY;

                    const willBeOut = await willBeOutsideBounds(-deltaX, -deltaY);

                    if (!willBeOut) {
                        const deltaPoint = new paper.Point(deltaX / zoom.value, deltaY / zoom.value)
                        paper.view.translate(deltaPoint);
                    }
                } 
            }
            
        }

        const panMoveGrabHandler = async (e: MouseEvent) => {
            if (paper.view) {
                const deltaPoint = new paper.Point(e.movementX / zoom.value, e.movementY  / zoom.value)
                const willBeOut = await willBeOutsideBounds(-e.movementX, -e.movementY);
                
                if (!willBeOut) {
                    paper.view.translate(deltaPoint) 
                }
            }
        }

        let isReadyToGrab = false;
        let isGrabbing = false;

        const resetPanHandlers = () => {
            document.body.style.cursor = 'default'
            document.removeEventListener('mouseup', panMouseUpHandler)
            document.removeEventListener('mousedown', panMouseDownHandler)
            document.removeEventListener('mousemove', panMoveGrabHandler)
            isReadyToGrab = false;
            isGrabbing = false;
            enableHandlers(); 
        }

        const panMouseUpHandler = () => {
            resetPanHandlers();
        }

        const panMouseDownHandler = () => {
            isGrabbing = true;
            document.addEventListener('mousemove', panMoveGrabHandler)
            document.addEventListener('mouseup', panMouseUpHandler)
        }


        const globalKeyDownHandler = (e: KeyboardEvent) => {
            if (e.code == 'Space') {
                e.preventDefault();
                e.stopPropagation();

                if (document.querySelector('.sandbox-wrap.move')) return;

                if (isGrabbing) {
                    document.body.style.cursor = 'grabbing';
                } else {
                    document.body.style.cursor = 'grab'
                }

                if (isReadyToGrab) return;
                disableHandlers(); 
                document.addEventListener('mousedown', panMouseDownHandler)

                isReadyToGrab = true;
            }
        } 

        const globalKeyUpHandler = (e: KeyboardEvent) => {
            if (e.code == 'Space') {
                e.preventDefault();
                e.stopPropagation();
                
                resetPanHandlers();
            }
        } 

        document.addEventListener('keyup', globalKeyUpHandler);
        document.addEventListener('keydown', globalKeyDownHandler);
        document.addEventListener('wheel', plainWheelHandler, {
            passive: false
        });

        //@ts-ignore
        window.sectorIntersectionAreas = sectorIntersectionAreas;
    })

    useTask$(({ track }) => {
        track(() => zoom.value);
        const value = zoom.value;

        try {
            const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
            if (canvas) {
                paper.view.zoom = value;
            }
        } catch (error) {
            //console.error(error);
        }
    })

    const currentMouseTool = useSignal('select');

    const moveToolMouseDownHandler = $((e: any) => {
        console.log(e)
        const isOnCanvas = e.target.classList.contains('canvas-wrap');
        if (!isOnCanvas) return;

        const mouseUpHandler = () => {
            document.removeEventListener('mousemove', mouseMoveHandler);
        }
        const mouseMoveHandler = (e: MouseEvent) => {
            if (document.querySelector('.sandbox-wrap.move')) {

                if (paper.view) {
                    const deltaPoint = new paper.Point(e.movementX / zoom.value, e.movementY  / zoom.value)
                    paper.view.translate(deltaPoint)
                }
            }
            document.addEventListener('mouseup', mouseUpHandler)
        }

        if (document.querySelector('.sandbox-wrap.move')) {
            document.addEventListener('mousemove', mouseMoveHandler);
        }
    })

    const moveToolScrollHandler = $((e: WheelEvent) => {
        if (document.querySelector('.sandbox-wrap.move')) {
            console.log({e});

            if (e.ctrlKey) return;

            if (paper.view) {
                const deltaX = e.shiftKey ? -e.deltaY : 0;
                const deltaY = e.shiftKey ? 0 : -e.deltaY;
                
                const deltaPoint = new paper.Point(deltaX / zoom.value, deltaY / zoom.value)
                paper.view.translate(deltaPoint)
            }
        }
    })

    const MoveToolHandlers = $((action: 'assign' | 'remove') => {
        if (action === 'assign') {
            document.addEventListener('wheel', moveToolScrollHandler);
            document.addEventListener('mousedown', moveToolMouseDownHandler);
        } else if (action === 'remove') {
            document.removeEventListener('wheel', moveToolScrollHandler);
            document.removeEventListener('mousedown', moveToolMouseDownHandler);
        }
    })


    const closeExportModal = $(() => {
        const exportWrap = document.querySelector('.export-wrap') as HTMLElement;
        exportWrap.classList.remove('export')
    })



    return (
        <>
        <script src="https://cdn.jsdelivr.net/npm/paper/dist/paper-full.min.js"></script>

        <div class={`sandbox-wrap ${currentMouseTool.value}`}>
            <div class="write-box"></div>
            <div class="sandbox-toolbar-outer">
                <div class="sandbox-toolbar-inner">
                    <div class="mouse-tools">
                        <div onClick$={() => {
                            currentMouseTool.value = 'select';
                            document.removeEventListener('mousedown', moveToolMouseDownHandler);
                            MoveToolHandlers('remove')
                            enableHandlers();
                        }} class={`select mouse-tool ${currentMouseTool.value === 'select' ? 'active' : ''}`}>
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path><path d="M13 13l6 6"></path></svg>
                        </div>
                        <div onClick$={() => {
                            currentMouseTool.value = 'move';
                            MoveToolHandlers('assign')
                            disableHandlers();
                        }} class={`move mouse-tool ${currentMouseTool.value === 'move' ? 'active' : ''}`}>
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="15 19 12 22 9 19"></polyline><polyline points="19 9 22 12 19 15"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>
                        </div>
                    </div>
                    <div class="content-control-wrap">
                        <button class="add-offense-player" onClick$={() => addOffensePlayer()} >Add Offense</button>
                        <button class="add-offense-player" onClick$={() => addDefensePlayer()} >Add Defense</button>
                        <button class="add-offense-player" onClick$={exportCanvasImage} >Export</button>
                        <button class="organize-players" onClick$={organizePlayersHandler} >Organize</button>
                        <button class="clear-players" onClick$={clearPlayersHandler} >Clear</button>
                    </div>
                    <div class="positional-control-wrap">
                        <button class="get-positionals-button">Get positionals</button>
                    </div>
                </div>
            </div>

            <div class="canvas-wrap">
                {//@ts-ignore
                    <canvas id="canvas" data-paper-resize="true" data-paper-hidpi="off"></canvas>
                }
            </div>

            <div class="view-actions-wrap">
                <div class="view-actions">
                    <div class="view-action field-scale">
                        <span class="field-scale-label">Field scale: {fieldScale.value}</span>
                        <input onInput$={fieldScaleRangeInputHandler} type="range" min={1} max={3} step={0.05} value={fieldScale.value} name="" id="" />
                    </div>
                    <div onClick$={() => {
                        if (zoom.value > 2) return;
                        zoom.value += 0.1;
                    }} class={`zoom-in view-action`}>
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                    </div>
                    <div onClick$={() => {
                        if (zoom.value < 0.5) return;
                        zoom.value -= 0.1;
                    }} class={`zoom-out view-action`}>
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                    </div>
                </div>
            </div>

            <div class="export-wrap">
                <div class="download-image-wrap">
                    {
                        // eslint-disable-next-line qwik/jsx-img
                        <img class="download-image-background"></img>
                    }
                    <div class="download-modal-controls">
                        <button onClick$={closeExportModal} class="close">← Go back</button>
                        <a href='' class="download">Download</a>
                    </div>
                </div>
            </div>
        </div>

        </>
    )
})

export const head = () => {
    return {
        title: `Front Cone Sandbox Testing`,
        meta: [
            {
                name: 'description',
                content: 'Sandbox testing paper.js',
            },
        ],
    };
}