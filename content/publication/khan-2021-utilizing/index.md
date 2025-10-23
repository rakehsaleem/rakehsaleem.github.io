---
title: 'Utilizing safety rule correlation for mobile scaffolds monitoring leveraging
  deep convolution neural networks'
authors:
- Numan Khan
- admin
- Doyeop Lee
- Man-Woo Park
- Chansik Park
date: '2021-01-01'

# Schedule page publish date (NOT publication's date).
publishDate: '2025-10-23T01:18:49.361652Z'

# Publication type.
# Accepts a single type but formatted as a YAML list (for Hugo requirements).
# Enter a publication type from the CSL standard.
publication_types:
- article-journal

# Publication name and optional abbreviated publication name.
publication: '*Computers in Industry*'
publication_short: ""

abstract: Falls from height (FFH) are still a leading cause of fatalities in the construction industry, which also includes scaffolding related accidents. Despite regular safety inspections, numerous scaffolding-related accidents occur at the construction site. The current safety monitoring practices are not only impractical but also infeasible due to the dynamicity of the construction environment. Since a separate computer training and detection process is generally required to acquire spatiotemporal reasoning to control a single hazard thus previous efforts in vision intelligence applications to improve safety monitoring are still limited to specific hazards. Also, in regard to detecting unsafe situations based on extracted correlations from safety rules, to date, previous studies have devoted little attention to this domain. To address these issues, this study proposes a correlation-based approach for mobile scaffold safety monitoring and detecting workers' unsafe behaviors. A deep neural network, Mask R-CNN, was used for the classification and segmentation of workers' tasks, combined with an object correlation detection (OCD) module to identify workers' unsafe behaviors. The approach divides the overall construction worker's safety into two subsets: classification of workers and detection of safe (class-1) and unsafe (class-2) behavior using the OCD block. The overall performance was evaluated on a set of real scenarios, with test results showing 85 % and 97 % precision and recall for class-1 (safe behavior) and 91 % and 65 % precision and recall for class-2 (unsafe behavior). The overall accuracy of 86 % confirms the Mask R-CNN-based OCD module's applicability for detecting workers' unsafe behavior effectively in a construction environment.


tags:
- automation
- deep learning
- risk recognition
- safety monitoring
featured: true

hugoblox:
  ids:
    arxiv: ''

links:
  - type: source
    url: https://www.sciencedirect.com/science/article/abs/pii/S0166361521000555
  - type: project
    url: ""

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder. 
image:
  caption: ""
  focal_point: ""
  preview_only: false

# Associated Projects (optional).
#   Associate this publication with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `internal-project` references `content/project/internal-project/index.md`.
#   Otherwise, set `projects: []`.
projects: []
---
