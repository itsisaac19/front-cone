import { $, component$, type NoSerialize, noSerialize, useSignal, useStore, useTask$, useVisibleTask$ } from '@builder.io/qwik';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

interface SectorFieldProps {
    circle: paper.Path.Circle,
    sectorRadius: number,
    sectorAngle: number,
    group: paper.Group,
    offense: boolean,
    index: number,
}

const sectorArray: paper.Path.Arc[] = [];
const sectorIntersectionAreas: { [authorId: number]: { [id: number]: paper.PathItem | undefined } }= {};

const drawSectorFieldOnCircle = (props: SectorFieldProps) => {
    const { circle: playerCircle, sectorRadius, sectorAngle, group, offense, index } = props;

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
    if (!offense) throughCircle.strokeColor = new paper.Color('#ededed');
    throughCircle.fillColor = offense ? new paper.Color('#fff') : new paper.Color('#000');
    throughCircle.opacity = 0;

    const end = new paper.Point(
        center.x + (radius + sectorRadius) * Math.cos(endAngle * (Math.PI / 180)),
        center.y + (radius + sectorRadius) * -Math.sin(endAngle * (Math.PI / 180))
    );

    
    const sector = Object.assign(new paper.Path.Arc(start, through, end), {
        applyMatrix: false,
        fillColor: new paper.Color(0, 0, 0, 0),
        strokeWidth: 2,
        strokeColor: new paper.Color('#1d1d1d')
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

                area.onMouseEnter = () => {
                    throughCircle.tween({
                        opacity: 1
                    }, {
                        duration: 300,
                        easing: 'easeOutCubic'
                    })
                }
                area.onMouseLeave = () => {
                    throughCircle.tween({
                        opacity: 0
                    }, {
                        duration: 300,
                        easing: 'easeOutCubic'
                    })
                }
                
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
                    fillColor: new paper.Color(0, 0, 0, 1),
                    strokeColor: new paper.Color('#1d1d1d')
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
                fillColor: new paper.Color(0, 0, 0, 1),
                strokeColor: new paper.Color('#1d1d1d')
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
            scaling: 0.9
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
    }

    let hasMouseLeft = false;
    let isMouseDown = false;

    const throughCircleDocumentMouseUpHandler = () => {
        enableHandlers();
        if (hasMouseLeft) {
            document.body.style.cursor = 'default';

            throughCircle.tween({
                opacity: 0
            }, {
                duration: 300,
                easing: 'easeOutCubic'
            })

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
        throughCircle.tween({
            opacity: 1
        }, {
            duration: 300,
            easing: 'easeOutCubic'
        })

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

    sector.onMouseEnter = () => {
        throughCircle.tween({
            opacity: 1
        }, {
            duration: 300,
            easing: 'easeOutCubic'
        })
    }
    sector.onMouseLeave = (e: any) => {
        const point = e.point as paper.Point;
        console.log({point})

        if (isMouseDown == false) {
            throughCircle.tween({
                opacity: 0
            }, {
                duration: 300,
                easing: 'easeOutCubic'
            })
        }
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

const getRandomInteger = ((min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
})

<<<<<<< Updated upstream
=======
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
/* const findAllItemsByName = $((name: string) => {
    const found = paper.project.activeLayer.children.filter(item => item.name === name);
    return found;
}) */

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

>>>>>>> Stashed changes
export default component$(() => {
    interface DrawPlayerProps {
        point: paper.Point,
        radius: number,
        sectorAngle: number,
        offense: boolean,
        index: number
    }

    type PlayerGroupStore = { [index: number]: NoSerialize<paper.Group> }

    const currentPlayerStore = useStore({
        playerGroups: {} as PlayerGroupStore
    })

    const drawPlayer = $((props: DrawPlayerProps) => {
        const { point, radius, sectorAngle, offense, index } = props;
    
        // Create the circle
        const circle = new paper.Path.Circle(point, radius);
        circle.applyMatrix = false; // Enables animations
    
        if (offense) { // if the player is offense
            circle.fillColor = new paper.Color(255 / 255, 255 / 255, 255 / 255, 1);
        } else {
            circle.fillColor = new paper.Color('#1d1d1d');
        }
        
        // Create Player Group
        const playerGroup = new paper.Group([circle]);
        playerGroup.applyMatrix = false; 
    
        // Define sector options
        const sectorRadius = 90;

        currentPlayerStore.playerGroups[index] = noSerialize(playerGroup);
    
        return drawSectorFieldOnCircle({
            circle,
            sectorRadius,
            sectorAngle,
            group: playerGroup,
            offense,
            index
        })
    })

    const offenseSectorAngle = useSignal(90);
    const defenseSectorAngle = useSignal(60);

<<<<<<< Updated upstream
    const zoom = useSignal(1);
=======
    const zoom = useSignal(0.7);
>>>>>>> Stashed changes
    const playerCount = useSignal(0);

    const addOffensePlayer = $(async () => {
        const canvas = document.querySelector('#canvas') as HTMLCanvasElement;

        const randomPoint = new paper.Point(getRandomInteger(50, canvas.width - 50), getRandomInteger(250, canvas.height - 50));

        drawPlayer({
            point: randomPoint,
            radius: 30,
            sectorAngle: offenseSectorAngle.value,
            offense: true,
            index: playerCount.value
        })
        playerCount.value++;

        //console.log(paper.project.activeLayer.children)
    })
    const addDefensePlayer = $(async () => {
        const canvas = document.querySelector('#canvas') as HTMLCanvasElement;

        const randomPoint = new paper.Point(getRandomInteger(50, canvas.width - 50), getRandomInteger(250, canvas.height - 50));
        
        drawPlayer({
            point: randomPoint,
            radius: 30,
            sectorAngle: offenseSectorAngle.value,
            offense: false,
            index: playerCount.value
        })
        playerCount.value++;
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

<<<<<<< Updated upstream
    useVisibleTask$(() => {
        const offenseValue = offenseSectorAngle.value;
        const defenseValue = defenseSectorAngle.value;
=======
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

            console.log(field.bounds)

            let exportSize = {
                height: field.bounds.height,
                width: (field.bounds.height * 0.846)
            }

            if (field.name === 'horizontal') {
                exportSize = {
                    height: (field.bounds.width * 0.846),
                    width: field.bounds.width
                }
            }

            exportWrap.style.height = exportSize.height + 'px';
            exportWrap.style.width = exportSize.width + 'px';

            paper.view.viewSize.height = exportSize.height;
            paper.view.viewSize.width = exportSize.width;

            paper.view.center = field.bounds.center
            paper.view.zoom = 1;

            const mark = await findItemByName('mark') as paper.PointText;
            mark.scaling = new paper.Point(0.65, 0.65);
            mark.scale((field.scaling.x));
            const markPoint = field.bounds.topCenter.add(new paper.Point(0, 40 * field.scaling.x));
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

    const fieldScale = useSignal(1.5);
    const fieldOrientation = useSignal<'horizontal' | 'vertical'>('vertical');

    useTask$(async ({ track }) => {
        track(() => fieldOrientation.value) 
        const value = fieldOrientation.value;

        try {
            const fieldLayer = await findLayer('field');
            const field = fieldLayer?.children[0];

            if (!field) return;
    
            field.name = value;

            if (value === 'horizontal') {
                field.tween({
                    rotation: 90
                }, {
                    easing: 'easeInOutCubic',
                    duration: 1400
                })
                console.log(field.rotation)
                field.children.forEach(fieldElement => {
                    if (fieldElement.name === 'field-label') {
                        fieldElement.tween({
                            rotation: -90
                        }, {
                            easing: 'easeInOutCubic',
                            duration: 1400
                        })
                    }  
                })
            } else {
                field.tween({
                    rotation: 0
                }, {
                    easing: 'easeInOutCubic',
                    duration: 1400
                })
                field.children.forEach(fieldElement => {
                    if (fieldElement.name === 'field-label') {
                        fieldElement.tween({
                            rotation: 0
                        }, {
                            easing: 'easeInOutCubic',
                            duration: 1400
                        })
                    }  
                })
            }
        } catch (error) {
            //console.error(error);
        }
    })

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
        if (fieldOrientation.value === 'horizontal') {
            const suggested = Math.round((window.innerHeight / 700) * 20) / 20;
            fieldScale.value = suggested >= 1 ? suggested : 1;
        } else {
            const suggested = Math.round((window.innerHeight / 900) * 20) / 20;
            fieldScale.value = suggested >= 1 ? suggested : 1;
        }

>>>>>>> Stashed changes
        document.body.style.overflow = 'hidden';

        try {
            const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
            if (canvas) {
                paper.setup(canvas);
                paper.view.zoom = zoom.value;
                paper.view.onResize = () => {
                    canvas.width = document.body.offsetWidth;
                    canvas.height = (document.body.clientHeight - 1);
                }

                drawPlayer({
                    point: new paper.Point(paper.view.center.x - 100, canvas.height / 2),
                    radius: 30,
                    sectorAngle: offenseValue,
                    offense: true,
                    index: playerCount.value
                })
                playerCount.value++;

<<<<<<< Updated upstream
                drawPlayer({
                    point: new paper.Point(paper.view.center.x + 100, canvas.height / 2),
                    radius: 30,
                    sectorAngle: defenseValue,
                    offense: false,
                    index: playerCount.value
                })
                playerCount.value++;
=======
                field.position = paper.view.center;
                field.applyMatrix = false; 
                field.scale(fieldScale.value);
                field.name = fieldOrientation.value;

                if (fieldOrientation.value === 'horizontal') {
                    field.rotate(90);
                }

                field.children.forEach(fieldElement => {
                    if (fieldElement.name === 'field-label') {
                        fieldElement.applyMatrix = false;
                        if (fieldOrientation.value === 'horizontal') {
                            field.rotate(-90);
                        }
                    }  
                })


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
>>>>>>> Stashed changes
            }
        } catch (error) {
            console.error(error)
        } 


        const plainWheelHandler = (e: WheelEvent) => {
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
                    
                    const deltaPoint = new paper.Point(deltaX / zoom.value, deltaY / zoom.value)
                    paper.view.translate(deltaPoint)
                } 
            }
            
        }

        const panMoveGrabHandler = (e: MouseEvent) => {
            if (paper.view) {
                const deltaPoint = new paper.Point(e.movementX / zoom.value, e.movementY  / zoom.value)
                paper.view.translate(deltaPoint)
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
        const toolsParent = document.querySelector('.sandbox-toolbar-outer') as HTMLElement;
        const isTool = (toolsParent.contains(e.target))
        if (isTool) return;

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

    return (
        <>
        <script src="https://cdn.jsdelivr.net/npm/paper/dist/paper-full.min.js"></script>

        <div class={`sandbox-wrap ${currentMouseTool.value}`}>
            {//@ts-ignore
            <canvas id="canvas" resize></canvas>
            }
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
<<<<<<< Updated upstream
                        <button class="add-offense-player" onClick$={addOffensePlayer} >Add Offense</button>
                        <button class="add-offense-player" onClick$={addDefensePlayer} >Add Defense</button>
=======
                        <button class="add-offense-player" onClick$={() => addOffensePlayer()} >Add Offense</button>
                        <button class="add-offense-player" onClick$={() => addDefensePlayer()} >Add Defense</button>
                        <div class="spacer"></div>
>>>>>>> Stashed changes
                        <button class="organize-players" onClick$={organizePlayersHandler} >Organize</button>
                        <button class="clear-players" onClick$={clearPlayersHandler} >Clear Field</button>
                        <button class="field-orientation" onClick$={() => {
                            if (fieldOrientation.value === 'horizontal') return fieldOrientation.value = 'vertical';
                            if (fieldOrientation.value === 'vertical') return fieldOrientation.value = 'horizontal';
                        }} >Rotate Field</button>
                        <div class="spacer"></div>
                        <button class="add-offense-player" onClick$={exportCanvasImage} >Export Image</button>
                    </div>
                    <div class="positional-control-wrap">
                        <button class="get-positionals-button">Get positionals</button>
                    </div>
                </div>
            </div>

            <div class="view-actions-wrap">
                <div class="view-actions">
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