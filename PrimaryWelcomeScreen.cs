using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;

public class PrimaryWelcomeScreen : MonoBehaviour
{

    public TextAsset txt;
    public List<string> lines;
    public int curPrim;
    public TextMeshProUGUI mText;
    public bool dem;
    public int primariesToRun = 4;
    public string s = "Upcoming Primaries: ";

    // Start is called before the first frame update
    void Start()
    {
        curPrim = (int)Variables.Saved.Get("curPrimary");
        dem = (bool)Variables.Saved.Get("Democrats");
        if (dem)
        {
            TextAsset txt = (TextAsset)Resources.Load("PrimaryStateData_D", typeof(TextAsset));
        }
        else
        {
            TextAsset txt = (TextAsset)Resources.Load("PrimaryStateData_R", typeof(TextAsset));
        }
        lines = (txt.text.Split('\n').ToList());
        for (int i = curPrim; i < Mathf.Min(lines.Count, curPrim + primariesToRun); i++)
        {
            List<string> l = new List<string>(lines[i].Split('\t').ToList());
            if (i < Mathf.Min(lines.Count, curPrim + primariesToRun) - 1)
            {
                s = s + l[0] + ", ";
            }
            else
            {
                s = s + l[0];
            }
        }
        mText.text = s;
        
    }
}
