using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;

public class FormatTextColors : MonoBehaviour
{
    public List<TextMeshProUGUI> header1 = new List<TextMeshProUGUI>();
    public List<TextMeshProUGUI> header2 = new List<TextMeshProUGUI>();
    public List<TextMeshProUGUI> paragraph = new List<TextMeshProUGUI>();
    public List<TextMeshProUGUI> numbers = new List<TextMeshProUGUI>();
    public List<TextMeshProUGUI> labels = new List<TextMeshProUGUI>();
    public List<TextMeshProUGUI> buttonText = new List<TextMeshProUGUI>();
    Color greenColor = new Color(0.55f, 1.0f, 0.78f, 1.0f);
    Color blueColor = new Color(0.486f, 0.8f, 1.0f, 1.0f);
    Color whiteColor = new Color(1.0f, 1.0f, 1.0f, 1.0f);
    

    // Start is called before the first frame update
    void Start()
    {
        foreach (TextMeshProUGUI t in header1)
        {
            t.color = whiteColor;
        }
        foreach (TextMeshProUGUI t in header2)
        {
            t.color = blueColor;
        }
        foreach (TextMeshProUGUI t in paragraph)
        {
            t.color = greenColor;
        }
        foreach (TextMeshProUGUI t in numbers)
        {
            t.color = blueColor;
        }
        foreach (TextMeshProUGUI t in labels)
        {
            t.color = greenColor;
        }
        foreach (TextMeshProUGUI t in buttonText)
        {
            t.color = whiteColor;
        }
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
